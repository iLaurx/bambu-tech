// Shared contract. Safe to import in client components; no credentials or server imports.
export const CATEGORIES = ["Celulares", "Bocinas", "Smartbands", "Smartwatches", "Otros"] as const
export const CONDITIONS = ["Nuevo", "Reacondicionado"] as const
export type Category = (typeof CATEGORIES)[number]
export type Condition = (typeof CONDITIONS)[number]
export type Specs = Record<string, string | number | boolean>
export type ProductInput = {
  title: string
  category: Category
  brand: string
  price: number
  condition: Condition
  description: string
  specs: Specs
  main_image: string
  gallery_images: string[]
  is_active: boolean
  is_sold: boolean
}
export type ProductRecord = ProductInput & {
  id: string
  views_count: number
  created_at: string
}
export type InventoryMetrics = { total: number; available: number; sold: number; views: number }
export type PublicSettings = { whatsapp_number: string | null }
export type ApiErrorCode = "VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNAVAILABLE" | "INTERNAL"
export type ApiResult<T> = { data: T } | { error: { code: ApiErrorCode; message: string } }
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const IMAGE_BUCKET = "bambu-products"
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const ASSET_PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/

export function imageUrl(path: string): string {
  if (!ASSET_PATH_PATTERN.test(path)) throw new Error("Referencia de imagen inválida")
  return `/api/catalog/images/${path.split("/")[1].slice(0, -5)}`
}

export function formatMxn(price: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(price)
}

export function whatsAppUrl(settings: PublicSettings, product: Pick<ProductRecord, "title" | "price">): string | null {
  const number = settings.whatsapp_number
  if (!number || !/^\+[1-9][0-9]{7,14}$/.test(number)) return null
  return `https://wa.me/${number.slice(1)}?text=${encodeURIComponent(`Hola, me interesa ${product.title}, con precio de ${formatMxn(product.price)} MXN.`)}`
}

// Half-open ranges [min, max): 5000 belongs only to the second interval.
export const CATALOG_PRICE_RANGES = [
  { min: 0, max: 5000 }, { min: 5000, max: 10000 },
  { min: 10000, max: 20000 }, { min: 20000, max: null },
] as const
