import "server-only"
import type { ProductRecord } from "./contract"

// Explicit opt-in; a production process with this flag fails closed instead.
export const demoRequested = () => process.env.BAMBU_DEMO === "1"
export const demoEnabled = () => demoRequested() && process.env.NODE_ENV === "development"

const examples = [
  ["11111111-1111-4111-8111-111111111111", "iPhone 14", "Apple", 8999, [["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "iphone-14.png"]]],
  ["22222222-2222-4222-8222-222222222222", "Galaxy A55", "Samsung", 6999, [["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "galaxy-a55.png"]]],
  ["33333333-3333-4333-8333-333333333333", "Redmi Note 13 Pro", "Xiaomi", 5499, [["cccccccc-cccc-4ccc-8ccc-cccccccccccc", "redmi-note-13-pro.png"]]],
  ["44444444-4444-4444-8444-444444444444", "iPhone 15 Pro", "Apple", 19999, [["d0000001-0000-4000-8000-000000000001", "iphone-15-pro.png"], ["d0000002-0000-4000-8000-000000000002", "iphone-15-pro-back.png"], ["d0000003-0000-4000-8000-000000000003", "iphone-15-pro-side.png"]]],
  ["55555555-5555-4555-8555-555555555555", "Galaxy S24 Ultra", "Samsung", 22999, [["d0000004-0000-4000-8000-000000000004", "galaxy-s24-ultra.png"], ["d0000005-0000-4000-8000-000000000005", "galaxy-s24-ultra-back.png"]]],
  ["66666666-6666-4666-8666-666666666666", "Moto G84", "Motorola", 3999, [["d0000006-0000-4000-8000-000000000006", "moto-g84.png"]]],
  ["77777777-7777-4777-8777-777777777777", "Motorola Edge 50 Pro", "Motorola", 7999, [["d0000007-0000-4000-8000-000000000007", "motorola-edge-50-pro.png"]]],
  ["88888888-8888-4888-8888-888888888888", "Xiaomi 14", "Xiaomi", 13999, [["d0000008-0000-4000-8000-000000000008", "xiaomi-14.png"], ["d0000009-0000-4000-8000-000000000009", "xiaomi-14-back.png"]]],
] as const

export const demoProducts: ProductRecord[] = examples.map(([id, title, brand, price, images]) => ({
  id, title: `${title} · ejemplo`, brand, price, category: "Celulares", condition: "Reacondicionado",
  description: "Producto y precio de demostración; no representan inventario real.", specs: {},
  main_image: `${id}/${images[0][0]}.webp`, gallery_images: images.slice(1).map(([asset]) => `${id}/${asset}.webp`), is_active: true, is_sold: false,
  views_count: 0, created_at: "2026-01-01T00:00:00.000Z",
}))
export function demoImageName(id: string): string | undefined {
  for (const [, , , , images] of examples) {
    for (const [asset, name] of images) if (asset === id) return name
  }
  return undefined
}
