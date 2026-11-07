import "server-only"
import type { ProductRecord } from "./contract"

// Explicit opt-in; a production process with this flag fails closed instead.
export const demoRequested = () => process.env.BAMBU_DEMO === "1"
export const demoEnabled = () => demoRequested() && process.env.NODE_ENV === "development"

const examples = [
  ["11111111-1111-4111-8111-111111111111", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "iPhone 14", "Apple", 8999, "iphone-14.png"],
  ["22222222-2222-4222-8222-222222222222", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Galaxy A55", "Samsung", 6999, "galaxy-a55.png"],
  ["33333333-3333-4333-8333-333333333333", "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Redmi Note 13 Pro", "Xiaomi", 5499, "redmi-note-13-pro.png"],
] as const

export const demoProducts: ProductRecord[] = examples.map(([id, asset, title, brand, price]) => ({
  id, title: `${title} · ejemplo`, brand, price, category: "Celulares", condition: "Reacondicionado",
  description: "Producto y precio de demostración; no representan inventario real.", specs: {},
  main_image: `${id}/${asset}.webp`, gallery_images: [], is_active: true, is_sold: false,
  views_count: 0, created_at: "2026-01-01T00:00:00.000Z",
}))
export function demoImageName(id: string): string | undefined {
  return examples.find(([, asset]) => asset === id)?.[5]
}
