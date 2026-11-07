import { ASSET_PATH_PATTERN, CATEGORIES, CONDITIONS, UUID_PATTERN, type Category, type ProductInput, type Specs } from "./contract"

export class ValidationError extends Error {}
const fail = (message: string): never => { throw new ValidationError(message) }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("Se esperaba un objeto.")
  return value as Record<string, unknown>
}
export function onlyKeys(data: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(data).some((key) => !keys.includes(key))) fail("La solicitud contiene campos no permitidos.")
}
export function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) return fail("Identificador inválido.")
  return value.toLowerCase()
}
function text(value: unknown, name: string, max: number, required = true): string {
  if (typeof value !== "string") return fail(`${name}: texto inválido.`)
  const result = value.trim()
  if ((required && !result) || result.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(result)) return fail(`${name}: longitud o contenido inválido.`)
  return result
}
type SpecKind = "text" | "positive" | "boolean"
const common = { color: "text" } as const
export const SPEC_FIELDS: Record<Category, Record<string, SpecKind>> = {
  Celulares: { ...common, processor: "text", ram_gb: "positive", storage_gb: "positive", battery_mah: "positive", unlocked: "boolean" },
  Bocinas: { ...common, power_w: "positive", connectivity: "text", battery_hours: "positive", water_resistance: "text" },
  Smartbands: { ...common, screen: "text", battery_days: "positive", connectivity: "text", water_resistance: "text" },
  Smartwatches: { ...common, screen: "text", battery_days: "positive", connectivity: "text", compatibility: "text", water_resistance: "text" },
  Otros: { ...common, features: "text" },
}
export function specs(value: unknown, category: Category): Specs {
  const data = object(value)
  const fields = SPEC_FIELDS[category]
  onlyKeys(data, Object.keys(fields))
  const result: Specs = {}
  for (const [key, item] of Object.entries(data)) {
    if (fields[key] === "text") result[key] = text(item, key, key === "features" ? 1000 : 200)
    else if (fields[key] === "boolean") {
      if (typeof item !== "boolean") fail(`${key}: se esperaba Sí/No.`)
      result[key] = item as boolean
    } else {
      if (typeof item !== "number" || !Number.isFinite(item) || item <= 0 || item > 1000000 || Math.abs(item * 100 - Math.round(item * 100)) > 0.000001) fail(`${key}: número positivo inválido.`)
      result[key] = item as number
    }
  }
  return result
}
export function productInput(value: unknown, productId: string): ProductInput {
  const data = object(value)
  onlyKeys(data, ["title", "category", "brand", "price", "condition", "description", "specs", "main_image", "gallery_images", "is_active", "is_sold"])
  if (!CATEGORIES.includes(data.category as Category)) fail("Categoría inválida.")
  if (!CONDITIONS.includes(data.condition as (typeof CONDITIONS)[number])) fail("Condición inválida.")
  if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0 || data.price > 99999999.99 || Math.abs(data.price * 100 - Math.round(data.price * 100)) > 0.000001) fail("El precio debe ser positivo y tener como máximo dos decimales.")
  if (typeof data.is_active !== "boolean" || typeof data.is_sold !== "boolean") fail("Los estados deben ser booleanos independientes.")
  const validatePath = (path: unknown): string => {
    if (typeof path !== "string" || !ASSET_PATH_PATTERN.test(path) || !path.startsWith(`${productId}/`)) return fail("Referencia de imagen inválida para este producto.")
    uuid(path.split("/")[1].slice(0, -5))
    return path
  }
  if (!Array.isArray(data.gallery_images) || data.gallery_images.length > 3) fail("Se permiten hasta tres imágenes secundarias.")
  const main_image = validatePath(data.main_image)
  const gallery_images = (data.gallery_images as unknown[]).map(validatePath)
  if (new Set([main_image, ...gallery_images]).size !== gallery_images.length + 1) fail("No se permiten imágenes repetidas.")
  return {
    title: text(data.title, "Título", 200), category: data.category as Category,
    brand: text(data.brand, "Marca", 80), price: data.price as number,
    condition: data.condition as ProductInput["condition"], description: text(data.description, "Descripción", 10000, false),
    specs: specs(data.specs, data.category as Category), main_image, gallery_images,
    is_active: data.is_active as boolean, is_sold: data.is_sold as boolean,
  }
}
export function whatsappInput(value: unknown): string | null {
  if (value === null || value === "") return null
  if (typeof value !== "string") return fail("Número de WhatsApp inválido.")
  const normalized = value.replace(/[\s()-]/g, "")
  if (!/^\+[1-9][0-9]{7,14}$/.test(normalized)) return fail("Usa el formato internacional, por ejemplo + seguido de código de país y número.")
  return normalized
}
