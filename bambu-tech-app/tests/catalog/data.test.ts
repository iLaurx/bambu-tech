import assert from "node:assert/strict"
import { test } from "node:test"
import { activeProducts, catalogBrands, filteredProducts, productSpecs, catalogRequest, CatalogError } from "../../components/catalog-data"
import { whatsAppUrl, type ProductRecord } from "../../lib/backend/contract"
const row = (patch: Partial<ProductRecord> = {}): ProductRecord => ({ id: "11111111-1111-4111-8111-111111111111", title: "Teléfono", category: "Celulares", brand: "Todos", price: 5000, condition: "Nuevo", description: "", specs: { unlocked: false }, main_image: "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.webp", gallery_images: [], is_active: true, is_sold: false, created_at: "2026-01-01", views_count: 0, ...patch })
test("activos agotados visibles, ocultos excluidos y marcas libres sin colisionar sentinel", () => {
 const rows = [row(), row({ brand: "all", is_sold: true }), row({ brand: "Oculta", is_active: false })]
 assert.equal(activeProducts(rows).length, 2); assert.deepEqual(catalogBrands(rows), ["all", "Todos"])
 assert.equal(filteredProducts(rows, "", "Todos", "Todos", "all").length, 1)
})
test("filtros combinables por título/marca, categoría, marca exacta y fronteras precio", () => {
 const rows = [row(), row({ title: "Bocina", category: "Bocinas", brand: "Libre", price: 10000 }), row({ price: 20000 })]
 assert.equal(filteredProducts(rows, " libre ", "Bocinas", "Libre", "2").length, 1)
 assert.equal(filteredProducts(rows, "libre", "Celulares", "", "all").length, 0)
 for (const [price, expected] of [[4999.99, "0"], [5000, "1"], [10000, "2"], [20000, "3"]] as const) {
   for (const range of ["0", "1", "2", "3"] as const) assert.equal(filteredProducts([row({ price })], "", "Todos", "", range).length, range === expected ? 1 : 0)
 }
})
test("especificaciones omiten desconocidos y claves de otras categorías, conservan false", () => {
 assert.deepEqual(productSpecs(row()), [{ key: "unlocked", label: "Liberado para cualquier compañía", value: "No" }])
 assert.deepEqual(productSpecs(row({ category: "Bocinas", specs: { ram_gb: 8, power_w: 20, battery_hours: 0 } })), [{ key: "power_w", label: "Potencia", value: "20 W" }])
 assert.deepEqual(productSpecs(row({ category: "Otros", specs: {} })), [])
})
test("WhatsApp sin número es null y con agotado incluye título y centavos codificados", () => {
 assert.equal(whatsAppUrl({ whatsapp_number: null }, row()), null)
 const url = new URL(whatsAppUrl({ whatsapp_number: "+523312345678" }, row({ title: "A & B", price: 12.34, is_sold: true }))!)
 assert.match(url.searchParams.get("text")!, /A & B/); assert.match(url.searchParams.get("text")!, /12\.34/)
})
test("cliente usa no-store y traduce errores sin filtrar diagnósticos", async () => {
 const original = globalThis.fetch
 try {
  globalThis.fetch = async (_, options) => { assert.equal(options?.cache, "no-store"); assert.equal(options?.credentials, "same-origin"); return Response.json({ error: { message: "secret diagnostic" } }, { status: 503 }) }
  await assert.rejects(catalogRequest("/api/catalog/products"), failure => failure instanceof CatalogError && !failure.message.includes("secret"))
  globalThis.fetch = async () => Response.json({ error: {} }, { status: 404 })
  await assert.rejects(catalogRequest("/api/catalog/products/id"), failure => failure instanceof CatalogError && failure.status === 404)
 } finally { globalThis.fetch = original }
})
