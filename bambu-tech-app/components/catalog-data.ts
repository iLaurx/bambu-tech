import { CATALOG_PRICE_RANGES, type Category, type ProductRecord } from "@/lib/backend/contract"
export type CatalogCategory = "Todos" | Category
export type PriceRange = "all" | "0" | "1" | "2" | "3"
export const PRICE_OPTIONS = ["Todos los precios", "Menos de $5,000", "$5,000 a menos de $10,000", "$10,000 a menos de $20,000", "$20,000 o más"]
export class CatalogError extends Error { constructor(message: string, public status = 0) { super(message) } }
export async function catalogRequest<T>(path: string, method = "GET"): Promise<T> {
  let response: Response
  try { response = await fetch(path, { method, credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(20000) }) }
  catch { throw new CatalogError("No pudimos conectar con la tienda. Revisa tu conexión.") }
  let body: unknown
  try { body = await response.json() } catch { throw new CatalogError("El servicio no está disponible. Inténtalo de nuevo.", response.status) }
  if (!response.ok) throw new CatalogError(response.status === 404 ? "Este producto ya no está disponible en el catálogo." : "No pudimos cargar la información. Inténtalo de nuevo.", response.status)
  if (!body || typeof body !== "object" || !("data" in body)) throw new CatalogError("La respuesta de la tienda no es válida.")
  return (body as { data: T }).data
}
export const activeProducts = (rows: ProductRecord[]) => rows.filter(row => row.is_active)
export function catalogBrands(rows: ProductRecord[]): string[] { return [...new Set(activeProducts(rows).map(row => row.brand))].sort((a, b) => a.localeCompare(b, "es-MX")) }
export function filteredProducts(rows: ProductRecord[], query: string, category: CatalogCategory, brand: string, price: PriceRange) {
  const normalized = query.trim().toLocaleLowerCase("es-MX")
  const range = price === "all" ? null : CATALOG_PRICE_RANGES[Number(price)]
  return activeProducts(rows).filter(row => (category === "Todos" || row.category === category) && (!brand || row.brand === brand) && (!range || (row.price >= range.min && (range.max === null || row.price < range.max))) && (!normalized || `${row.title} ${row.brand}`.toLocaleLowerCase("es-MX").includes(normalized)))
}
const FIELDS: Record<Category, [string, string, string?][]> = {
  Celulares: [["color", "Color"], ["processor", "Procesador"], ["ram_gb", "Memoria RAM", "GB"], ["storage_gb", "Almacenamiento (ROM)", "GB"], ["battery_mah", "Batería", "mAh"], ["unlocked", "Liberado para cualquier compañía"]],
  Bocinas: [["color", "Color"], ["power_w", "Potencia", "W"], ["connectivity", "Conectividad"], ["battery_hours", "Autonomía", "horas"], ["water_resistance", "Resistencia al agua"]],
  Smartbands: [["color", "Color"], ["screen", "Pantalla"], ["battery_days", "Autonomía", "días"], ["connectivity", "Conectividad"], ["water_resistance", "Resistencia al agua"]],
  Smartwatches: [["color", "Color"], ["screen", "Pantalla"], ["battery_days", "Autonomía", "días"], ["connectivity", "Conectividad"], ["compatibility", "Compatibilidad"], ["water_resistance", "Resistencia al agua"]],
  Otros: [["color", "Color"], ["features", "Características"]],
}
export function productSpecs(product: ProductRecord): { key: string; label: string; value: string }[] {
  return FIELDS[product.category].flatMap(([key, label, unit]) => {
    const value = product.specs[key]
    if (value === undefined || value === null || value === "" || (typeof value === "number" && (!Number.isFinite(value) || value <= 0))) return []
    return [{ key, label, value: typeof value === "boolean" ? value ? "Sí" : "No" : `${value}${unit ? ` ${unit}` : ""}` }]
  })
}
