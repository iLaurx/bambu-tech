export type Brand = "Apple" | "Samsung" | "Xiaomi" | "Motorola"

export type Condition = "Nuevo" | "Reacondicionado"

export type Product = {
  id: string
  model: string
  brand: Brand
  condition: Condition
  price: number
  ram: number
  storage: number
  processor: string
  battery: number
  unlocked: boolean
  description: string
  images: string[]
  color: string
  isSold: boolean
}

export const BRANDS: Array<"Todos" | Brand> = ["Todos", "Apple", "Samsung", "Xiaomi", "Motorola"]

export const PRICE_RANGES = [
  { value: "all", label: "Todos los precios", min: 0, max: Infinity },
  { value: "0-5000", label: "Menos de $5,000", min: 0, max: 5000 },
  { value: "5000-10000", label: "$5,000 – $10,000", min: 5000, max: 10000 },
  { value: "10000-20000", label: "$10,000 – $20,000", min: 10000, max: 20000 },
  { value: "20000+", label: "Más de $20,000", min: 20000, max: Infinity },
] as const

export type PriceRangeValue = (typeof PRICE_RANGES)[number]["value"]

export const PRODUCTS: Product[] = [
  {
    id: "iphone-15-pro",
    model: "iPhone 15 Pro",
    brand: "Apple",
    condition: "Nuevo",
    price: 23999,
    ram: 8,
    storage: 256,
    processor: "Apple A17 Pro",
    battery: 3274,
    unlocked: true,
    description:
      "Diseño en titanio, más ligero y resistente. El chip A17 Pro ofrece un rendimiento de nivel consola y su cámara de 48 MP captura fotos increíbles hasta en poca luz. Incluye puerto USB-C y botón de Acción personalizable.",
    images: ["/phones/iphone-15-pro.png", "/phones/iphone-15-pro-back.png", "/phones/iphone-15-pro-side.png"],
    color: "Titanio natural",
    isSold: false,
  },
  {
    id: "iphone-14",
    model: "iPhone 14",
    brand: "Apple",
    condition: "Reacondicionado",
    price: 11499,
    ram: 6,
    storage: 128,
    processor: "Apple A15 Bionic",
    battery: 3279,
    unlocked: true,
    description:
      "Equipo reacondicionado y certificado, con batería en excelente estado. Pantalla Super Retina XDR de 6.1 pulgadas, cámara dual de 12 MP con modo Acción y detección de choques. Una gran opción calidad-precio.",
    images: ["/phones/iphone-14.png"],
    color: "Azul",
    isSold: false,
  },
  {
    id: "galaxy-s24-ultra",
    model: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    condition: "Nuevo",
    price: 26999,
    ram: 12,
    storage: 256,
    processor: "Snapdragon 8 Gen 3 for Galaxy",
    battery: 5000,
    unlocked: true,
    description:
      "El buque insignia de Samsung con marco de titanio, S Pen integrado y cámara de 200 MP con zoom óptico de 5x. Galaxy AI te ayuda a traducir llamadas, editar fotos y resumir notas al instante.",
    images: ["/phones/galaxy-s24-ultra.png", "/phones/galaxy-s24-ultra-back.png"],
    color: "Titanio gris",
    isSold: false,
  },
  {
    id: "galaxy-a55",
    model: "Samsung Galaxy A55 5G",
    brand: "Samsung",
    condition: "Nuevo",
    price: 7999,
    ram: 8,
    storage: 256,
    processor: "Exynos 1480",
    battery: 5000,
    unlocked: true,
    description:
      "Pantalla Super AMOLED de 6.6 pulgadas a 120 Hz, marco de aluminio y resistencia al agua IP67. Cámara principal de 50 MP con estabilización óptica y batería que dura todo el día.",
    images: ["/phones/galaxy-a55.png"],
    color: "Azul marino",
    isSold: false,
  },
  {
    id: "xiaomi-14",
    model: "Xiaomi 14",
    brand: "Xiaomi",
    condition: "Reacondicionado",
    price: 13499,
    ram: 12,
    storage: 512,
    processor: "Snapdragon 8 Gen 3",
    battery: 4610,
    unlocked: true,
    description:
      "Compacto y potente, con óptica Leica Summilux y sensor de 50 MP. Carga rápida de 90 W que te da el día completo en minutos. Reacondicionado con garantía y en condición estética impecable.",
    images: ["/phones/xiaomi-14.png", "/phones/xiaomi-14-back.png"],
    color: "Verde jade",
    isSold: false,
  },
  {
    id: "redmi-note-13-pro",
    model: "Redmi Note 13 Pro",
    brand: "Xiaomi",
    condition: "Nuevo",
    price: 5799,
    ram: 8,
    storage: 256,
    processor: "Snapdragon 7s Gen 2",
    battery: 5100,
    unlocked: true,
    description:
      "Cámara de 200 MP, pantalla AMOLED de 1.5K a 120 Hz y carga turbo de 67 W. Todo lo que necesitas en un equipo de gama media con acabados premium y excelente autonomía.",
    images: ["/phones/redmi-note-13-pro.png"],
    color: "Negro medianoche",
    isSold: false,
  },
  {
    id: "motorola-edge-50-pro",
    model: "Motorola Edge 50 Pro",
    brand: "Motorola",
    condition: "Nuevo",
    price: 8999,
    ram: 12,
    storage: 256,
    processor: "Snapdragon 7 Gen 3",
    battery: 4500,
    unlocked: false,
    description:
      "Acabado en piel vegana, pantalla curva pOLED de 144 Hz y colores validados por Pantone. Carga TurboPower de 125 W y cámara de 50 MP con IA. Equipo ligado a compañía telefónica.",
    images: ["/phones/motorola-edge-50-pro.png"],
    color: "Lavanda",
    isSold: false,
  },
  {
    id: "moto-g84",
    model: "Moto G84 5G",
    brand: "Motorola",
    condition: "Reacondicionado",
    price: 3999,
    ram: 8,
    storage: 256,
    processor: "Snapdragon 695 5G",
    battery: 5000,
    unlocked: true,
    description:
      "Conectividad 5G, pantalla pOLED de 6.5 pulgadas y sonido estéreo con Dolby Atmos. Reacondicionado y probado punto por punto, ideal para quien busca rendimiento confiable a buen precio.",
    images: ["/phones/moto-g84.png"],
    color: "Azul marshmallow",
    isSold: false,
  },
  {
    id: "iphone-13-vendido",
    model: "iPhone 13",
    brand: "Apple",
    condition: "Reacondicionado",
    price: 8999,
    ram: 4,
    storage: 128,
    processor: "Apple A15 Bionic",
    battery: 3240,
    unlocked: true,
    description: "Equipo vendido.",
    images: ["/phones/iphone-14.png"],
    color: "Medianoche",
    isSold: true,
  },
]

const priceFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 })

export function formatPrice(price: number) {
  return `$${priceFormatter.format(price)} MXN`
}

export function buildWhatsAppUrl(model: string) {
  return `https://wa.me/523311784478?text=${encodeURIComponent(`Hola, me interesa el equipo ${model}`)}`
}
