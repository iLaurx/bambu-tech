import assert from "node:assert/strict"
import { test } from "node:test"
import { productInput, specs, uuid, whatsappInput, ValidationError } from "../../lib/backend/validation"
import { imageUrl, whatsAppUrl, CATALOG_PRICE_RANGES } from "../../lib/backend/contract"
const id = "11111111-1111-4111-8111-111111111111"
const path = `${id}/22222222-2222-4222-8222-222222222222.webp`
const input = () => ({ title: "Equipo", category: "Celulares", brand: "Marca nueva", price: 19.99,
  condition: "Nuevo", description: "", specs: { unlocked: false }, main_image: path,
  gallery_images: [], is_active: true, is_sold: true })

test("activo agotado conserva estados independientes y datos desconocidos ausentes", () => {
  const parsed = productInput(input(), id)
  assert.equal(parsed.is_active, true)
  assert.equal(parsed.is_sold, true)
  assert.deepEqual(parsed.specs, { unlocked: false })
})
test("rechaza asignaciones de contador y campos de sistema", () => {
  for (const extra of [{ views_count: 100 }, { deleted_at: null }, { id }, { admin: true }]) {
    assert.throws(() => productInput({ ...input(), ...extra }, id), ValidationError)
  }
})
test("precio positivo, decimal máximo y finito", () => {
  for (const price of [0, -1, 1.111, Infinity, NaN, "19.99", 100000000]) assert.throws(() => productInput({ ...input(), price }, id), ValidationError)
  for (const price of [0.01, 12.34, 99999999.99]) assert.equal(productInput({ ...input(), price }, id).price, price)
})
test("galería limita cantidad, duplicados, pertenencia y URLs externas", () => {
  for (const patch of [{ gallery_images: [path] }, { gallery_images: ["https://example.com/img.webp"] },
    { main_image: "blob:abc" }, { main_image: `33333333-3333-4333-8333-333333333333/${path.split("/")[1]}` },
    { gallery_images: [path, path, path, path] }]) assert.throws(() => productInput({ ...input(), ...patch }, id), ValidationError)
})
test("specs valida claves, tipos y categoría sin inventar datos", () => {
  assert.deepEqual(specs({}, "Otros"), {})
  assert.deepEqual(specs({ power_w: 20.5 }, "Bocinas"), { power_w: 20.5 })
  for (const value of [{ processor: "Chip" }, { power_w: 0 }, { power_w: "20" }, { arbitrary: "x" }, { color: " " }]) assert.throws(() => specs(value, "Bocinas"), ValidationError)
})
test("campos obligatorios y tipos no se convierten silenciosamente", () => {
  for (const patch of [{ title: " " }, { is_active: "true" }, { condition: "Usado" }, { category: "Tablets" }, { specs: null }, { description: null }]) assert.throws(() => productInput({ ...input(), ...patch }, id), ValidationError)
})
test("WhatsApp normaliza, exige internacional, incluye nombre y precio y permite agotado", () => {
  const number = whatsappInput("+52 (33) 1234-5678")
  assert.equal(number, "+523312345678")
  assert.equal(whatsappInput(null), null)
  for (const value of ["523312345678", "+012345678", "+123", true]) assert.throws(() => whatsappInput(value), ValidationError)
  assert.equal(whatsAppUrl({ whatsapp_number: null }, { title: "Equipo", price: 19.99 }), null)
  const url = new URL(whatsAppUrl({ whatsapp_number: number }, { title: "Equipo & más", price: 19.99 })!)
  assert.match(url.searchParams.get("text")!, /Equipo & más/)
  assert.match(url.searchParams.get("text")!, /19\.99/)
  assert.equal(url.pathname, "/523312345678")
})
test("URLs de imagen y UUID rechazan rutas arbitrarias", () => {
  assert.equal(imageUrl(path), "/api/catalog/images/22222222-2222-4222-8222-222222222222")
  assert.throws(() => imageUrl("https://example.com/x"))
  assert.throws(() => uuid("../../asset"), ValidationError)
})
test("los límites exactos de precio pertenecen a un solo intervalo", () => {
  for (const price of [0.01, 4999.99, 5000, 10000, 20000, 99999999.99]) assert.equal(CATALOG_PRICE_RANGES.filter(range => price >= range.min && (range.max === null || price < range.max)).length, 1)
})
