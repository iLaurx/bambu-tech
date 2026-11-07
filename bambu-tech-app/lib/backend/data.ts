import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { IMAGE_BUCKET, type InventoryMetrics, type ProductRecord, type PublicSettings } from "./contract"
import { BackendError, databaseError } from "./errors"
import { requireAdmin, sessionClient, privilegedStorageClient } from "./supabase"
import { productInput, uuid } from "./validation"
import { validatedImage } from "./images"

const columns = "id,title,category,brand,price,condition,description,specs,main_image,gallery_images,is_active,is_sold,views_count,created_at"
function record(row: Record<string, unknown>): ProductRecord {
  const result = Object.fromEntries(columns.split(",").map(key => [key, row[key]]))
  return result as ProductRecord
}
async function productPages(client: SupabaseClient, publicOnly: boolean): Promise<ProductRecord[]> {
  const result: ProductRecord[] = []
  const pageSize = 200
  for (let offset = 0; ; offset += pageSize) {
    let query = client.from("products").select(columns).is("deleted_at", null)
      .order("created_at", { ascending: false }).order("id").range(offset, offset + pageSize - 1)
    if (publicOnly) query = query.eq("is_active", true)
    const { data, error } = await query
    databaseError(error)
    const rows = data ?? []
    result.push(...rows.map(row => record(row as unknown as Record<string, unknown>)))
    if (rows.length < pageSize) return result
  }
}
export async function listPublicProducts(): Promise<ProductRecord[]> {
  // Explicit filters also apply when this request happens to have an admin session.
  return productPages(await sessionClient(), true)
}
export async function publicProduct(id: string): Promise<ProductRecord> {
  const client = await sessionClient()
  const { data, error } = await client.from("products").select(columns).eq("id", uuid(id)).eq("is_active", true).is("deleted_at", null).maybeSingle()
  databaseError(error)
  if (!data) throw new BackendError("NOT_FOUND", "Producto no encontrado.", 404)
  return record(data as unknown as Record<string, unknown>)
}
export async function publicSettings(): Promise<PublicSettings> {
  const client = await sessionClient()
  const { data, error } = await client.from("settings").select("whatsapp_number").eq("id", 1).single()
  databaseError(error)
  return data as unknown as PublicSettings
}
export async function listAdminProducts(): Promise<ProductRecord[]> {
  const { client } = await requireAdmin()
  return productPages(client, false)
}
export async function saveProduct(id: string, body: unknown, create: boolean): Promise<ProductRecord> {
  const { client } = await requireAdmin()
  id = uuid(id)
  const input = productInput(body, id)
  const { data, error } = await client.rpc("save_product", { p_id: id, p_input: input, p_create: create })
  databaseError(error)
  return record(data)
}
export async function metrics(): Promise<InventoryMetrics> {
  const { client } = await requireAdmin()
  const { data, error } = await client.rpc("inventory_metrics")
  databaseError(error)
  return data as InventoryMetrics
}
export async function uploadImage(productId: string, bytes: Buffer, type: string | null) {
  const { user } = await requireAdmin()
  productId = uuid(productId)
  const output = await validatedImage(bytes, type)
  const client = privilegedStorageClient()
  const id = crypto.randomUUID()
  const path = `${productId}/${id}.webp`
  const upload = await client.storage.from(IMAGE_BUCKET).upload(path, output, { contentType: "image/webp", upsert: false, cacheControl: "0" })
  if (upload.error) throw new BackendError("UNAVAILABLE", "No fue posible almacenar la imagen. Inténtalo de nuevo.", 503)
  const registration = await client.rpc("register_asset", { p_id: id, p_product_id: productId, p_uploaded_by: user.id })
  // No automatic delete: retain unregistered objects privately and document manual recovery.
  if (registration.error) throw new BackendError("UNAVAILABLE", "La carga quedó incompleta. No guardes esta referencia; vuelve a cargar la imagen.", 503)
  return { id, path, url: `/api/catalog/images/${id}` }
}
