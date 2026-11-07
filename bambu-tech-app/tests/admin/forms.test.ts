import assert from "node:assert/strict"
import { test } from "node:test"
import { categorySpecs, formProduct, parsedSpecs } from "../../components/admin/product-form-values"
import { adminRequest, AdminApiError } from "../../components/admin/api"

const id = "11111111-1111-4111-8111-111111111111"
const photo = `${id}/22222222-2222-4222-8222-222222222222.webp`
const fields = () => ({ title: "Equipo", category: "Celulares" as const, brand: "Nueva marca", condition: "Nuevo" as const, description: "", price: "12,34", specs: { unlocked: "false", ram_gb: "", color: " Azul " }, is_active: true, is_sold: true })

test("formulario preserva falso, omite desconocidos y admite centavos sin inventar especificaciones", () => {
  const product = formProduct(id, fields(), [photo])
  assert.equal(product.price, 12.34)
  assert.deepEqual(product.specs, { color: "Azul", unlocked: false })
  assert.equal(product.is_active, true)
  assert.equal(product.is_sold, true)
})
test("cambiar categoría retira claves incompatibles y no convierte valores booleanos inválidos", () => {
  assert.deepEqual(categorySpecs("Bocinas", { ram_gb: "8", unlocked: "false", color: "Azul", power_w: "30" }), { color: "Azul", power_w: "30" })
  assert.throws(() => parsedSpecs("Celulares", { unlocked: "sí" }))
  assert.deepEqual(parsedSpecs("Otros", {}), {})
})
test("precios y fotos incompletos se rechazan antes de enviar", () => {
  for (const price of ["", "1.234", "-1", "0", "abc", "1e3"]) assert.throws(() => formProduct(id, { ...fields(), price }, [photo]))
  assert.throws(() => formProduct(id, fields(), []))
  assert.throws(() => formProduct(id, fields(), [photo, photo]))
})
test("cliente usa cookies del mismo origen y traduce rechazo de sesión a error controlado", async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.credentials, "same-origin")
    assert.equal(options?.cache, "no-store")
    return Response.json({ error: { code: "UNAUTHORIZED", message: "Inicia sesión." } }, { status: 401 })
  }
  try { await assert.rejects(adminRequest("/api/admin/session"), error => error instanceof AdminApiError && error.requiresLogin && error.message === "Inicia sesión.") }
  finally { globalThis.fetch = original }
})
test("cliente no expone HTML, errores de red ni JSON primario", async () => {
  const original = globalThis.fetch
  try {
    for (const value of [null, 5, "private diagnostic", []]) {
      globalThis.fetch = async () => Response.json(value)
      await assert.rejects(adminRequest("/api/admin/products"), error => error instanceof AdminApiError && !error.message.includes("private diagnostic"))
    }
    globalThis.fetch = async () => new Response("<html>private diagnostic</html>", { status: 503 })
    await assert.rejects(adminRequest("/api/admin/products"), error => error instanceof AdminApiError && !error.message.includes("private diagnostic"))
    globalThis.fetch = async () => { throw new Error("private network diagnostic") }
    await assert.rejects(adminRequest("/api/admin/products"), error => error instanceof AdminApiError && error.status === 0 && !error.message.includes("private network"))
  } finally { globalThis.fetch = original }
})
