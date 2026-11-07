import "server-only"
import { NextResponse } from "next/server"
import { appOrigin } from "./config"
import { IMAGE_BUCKET, MAX_IMAGE_BYTES } from "./contract"
import { listAdminProducts, listPublicProducts, metrics, publicProduct, publicSettings, saveProduct, uploadImage } from "./data"
import { BackendError, databaseError } from "./errors"
import { assertOrigin, endpoint, failure, jsonBody, readLimited } from "./http"
import { privilegedStorageClient, requireAdmin, sessionClient } from "./supabase"
import { object, onlyKeys, uuid, ValidationError, whatsappInput } from "./validation"

function credential(value: unknown, email = false): string {
  if (typeof value !== "string" || value.length > (email ? 254 : 128) || !value || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) throw new ValidationError("Correo o contraseña inválidos.")
  return email ? value.trim() : value
}
export async function backendRoute(request: Request, segments: string[]): Promise<Response> {
  const path = segments.join("/")
  const method = request.method
  if (method === "GET" && path === "catalog/products") return endpoint(request, listPublicProducts)
  if (method === "GET" && /^catalog\/products\/[^/]+$/.test(path)) return endpoint(request, () => publicProduct(segments[2]))
  if (method === "GET" && path === "catalog/settings") return endpoint(request, publicSettings)
  if (method === "POST" && /^catalog\/products\/[^/]+\/views$/.test(path)) return endpoint(request, async () => {
    const client = await sessionClient()
    const { error } = await client.rpc("increment_product_views", { p_id: uuid(segments[2]) })
    databaseError(error)
    return { accepted: true }
  })
  if (method === "GET" && /^catalog\/images\/[^/]+$/.test(path)) {
    try {
      const client = await sessionClient()
      const { data: path, error } = await client.rpc("image_path", { p_id: uuid(segments[2]) })
      databaseError(error)
      if (!path) throw new BackendError("NOT_FOUND", "Imagen no encontrada.", 404)
      // The user-scoped RPC authorized this exact asset; never accept a raw caller-supplied path.
      // Public Storage SELECT is denied, preventing public creation of long-lived signed URLs.
      const result = await privilegedStorageClient().storage.from(IMAGE_BUCKET).download(path)
      if (result.error || !result.data) throw new BackendError("NOT_FOUND", "Imagen no encontrada.", 404)
      return new Response(result.data, { headers: {
        "Content-Type": "image/webp", "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline",
      } })
    } catch (error) { return failure(error) }
  }
  if (method === "GET" && path === "admin/products") return endpoint(request, listAdminProducts)
  if (method === "GET" && path === "admin/metrics") return endpoint(request, metrics)
  if (method === "GET" && path === "admin/session") return endpoint(request, async () => {
    const { user } = await requireAdmin()
    return { id: user.id, email: user.email }
  })
  if ((method === "POST" || method === "PUT") && /^admin\/products\/[^/]+$/.test(path)) return endpoint(request, async () => {
    await requireAdmin()
    return saveProduct(segments[2], await jsonBody(request), method === "POST")
  }, method === "POST" ? 201 : 200)
  if (method === "PATCH" && /^admin\/products\/[^/]+\/states$/.test(path)) return endpoint(request, async () => {
    const { client } = await requireAdmin()
    const body = object(await jsonBody(request))
    onlyKeys(body, ["is_active", "is_sold"])
    if (typeof body.is_active !== "boolean" || typeof body.is_sold !== "boolean") throw new ValidationError("Indica visibilidad y disponibilidad por separado.")
    const { data, error } = await client.rpc("set_product_states", { p_id: uuid(segments[2]), p_is_active: body.is_active, p_is_sold: body.is_sold })
    databaseError(error)
    // Omit internal deletion timestamp; expose the same DTO as the other product operations.
    const { deleted_at: _deleted, ...product } = data
    return product
  })
  if (method === "DELETE" && /^admin\/products\/[^/]+$/.test(path)) return endpoint(request, async () => {
    const { client } = await requireAdmin()
    const body = object(await jsonBody(request))
    onlyKeys(body, ["confirm"])
    if (body.confirm !== true) throw new ValidationError("Confirma la eliminación del producto.")
    const { error } = await client.rpc("delete_product", { p_id: uuid(segments[2]) })
    databaseError(error)
    return { deleted: true }
  })
  if (method === "PUT" && path === "admin/settings") return endpoint(request, async () => {
    const { client } = await requireAdmin()
    const body = object(await jsonBody(request))
    onlyKeys(body, ["whatsapp_number"])
    const { data, error } = await client.rpc("save_whatsapp", { p_number: whatsappInput(body.whatsapp_number) })
    databaseError(error)
    return { whatsapp_number: data.whatsapp_number }
  })
  if (method === "POST" && /^admin\/uploads\/[^/]+$/.test(path)) return endpoint(request, async () => {
    await requireAdmin()
    return uploadImage(segments[2], await readLimited(request, MAX_IMAGE_BYTES), request.headers.get("content-type"))
  }, 201)
  if (method === "POST" && path === "auth/login") return endpoint(request, async () => {
    const body = object(await jsonBody(request))
    onlyKeys(body, ["email", "password"])
    const client = await sessionClient()
    const result = await client.auth.signInWithPassword({ email: credential(body.email, true), password: credential(body.password) })
    if (result.error) throw new BackendError("UNAUTHORIZED", "No fue posible iniciar sesión con esas credenciales.", 401)
    const membership = await client.rpc("admin_session")
    if (membership.error || membership.data !== true) {
      await client.auth.signOut({ scope: "local" })
      throw new BackendError("FORBIDDEN", "Tu cuenta no tiene acceso administrativo.", 403)
    }
    return { authenticated: true }
  })
  if (method === "POST" && path === "auth/logout") return endpoint(request, async () => {
    const client = await sessionClient()
    const result = await client.auth.signOut({ scope: "local" })
    if (result.error) throw new BackendError("UNAVAILABLE", "No fue posible cerrar la sesión.", 503)
    return { authenticated: false }
  })
  if (method === "POST" && path === "auth/recovery") return endpoint(request, async () => {
    const body = object(await jsonBody(request))
    onlyKeys(body, ["email"])
    const client = await sessionClient()
    // Auth handles account enumeration/rate limiting. Never reveal existence or membership.
    await client.auth.resetPasswordForEmail(credential(body.email, true), { redirectTo: `${appOrigin()}/api/auth/callback` })
    return { message: "Si la cuenta existe y puede recuperar acceso, recibirá instrucciones por correo." }
  })
  if (method === "GET" && path === "auth/callback") {
    try {
      const code = new URL(request.url).searchParams.get("code")
      if (!code || code.length > 4096) throw new ValidationError("Enlace de recuperación inválido.")
      const client = await sessionClient()
      const { error } = await client.auth.exchangeCodeForSession(code)
      if (error) throw new BackendError("UNAUTHORIZED", "El enlace de recuperación no es válido o ha expirado.", 401)
      const membership = await client.rpc("admin_session")
      if (membership.error || membership.data !== true) {
        await client.auth.signOut({ scope: "local" })
        throw new BackendError("FORBIDDEN", "Tu cuenta no tiene acceso administrativo.", 403)
      }
      return NextResponse.redirect(`${appOrigin()}/admin?recovery=1`, { status: 303, headers: { "Cache-Control": "private, no-store" } })
    } catch (error) { return failure(error) }
  }
  if (method === "POST" && path === "auth/password") return endpoint(request, async () => {
    const { client } = await requireAdmin()
    const body = object(await jsonBody(request))
    onlyKeys(body, ["password"])
    const password = credential(body.password)
    if (password.length < 12) throw new ValidationError("La contraseña debe tener al menos 12 caracteres.")
    const { error } = await client.auth.updateUser({ password })
    if (error) throw new BackendError("VALIDATION", "No se pudo actualizar la contraseña. Revisa los requisitos del servicio.", 400)
    return { updated: true }
  })
  // Unknown routes never reach a generic database or Storage proxy.
  try { if (!["GET", "HEAD"].includes(method)) assertOrigin(request) } catch (error) { return failure(error) }
  return failure(new BackendError("NOT_FOUND", "Operación no encontrada.", 404))
}
