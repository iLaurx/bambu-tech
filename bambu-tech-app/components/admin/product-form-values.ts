import { productInput, SPEC_FIELDS, ValidationError } from "@/lib/backend/validation"
import type { Category, ProductInput, Specs } from "@/lib/backend/contract"

export const SPEC_LABELS: Record<string, string> = {
  color: "Color", processor: "Procesador", ram_gb: "RAM (GB)", storage_gb: "Almacenamiento (GB)", battery_mah: "Batería (mAh)", unlocked: "Liberado para cualquier compañía",
  power_w: "Potencia (W)", connectivity: "Conectividad", battery_hours: "Autonomía (horas)", water_resistance: "Resistencia al agua", screen: "Pantalla", battery_days: "Autonomía (días)", compatibility: "Compatibilidad", features: "Características",
}
export function categorySpecs(category: Category, values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([key]) => key in SPEC_FIELDS[category]))
}
export function parsedSpecs(category: Category, values: Record<string, string>): Specs {
  const result: Specs = {}
  for (const [key, kind] of Object.entries(SPEC_FIELDS[category])) {
    const value = values[key]?.trim()
    if (!value) continue
    if (kind === "boolean") {
      if (!["true", "false"].includes(value)) throw new ValidationError(`${SPEC_LABELS[key]}: selecciona una opción válida.`)
      result[key] = value === "true"
    } else if (kind === "positive") result[key] = Number(value.replace(",", "."))
    else result[key] = value
  }
  return result
}
export function formProduct(id: string, fields: Omit<ProductInput, "price" | "specs" | "main_image" | "gallery_images"> & { price: string; specs: Record<string, string> }, photos: string[]): ProductInput {
  if (!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(fields.price.trim())) throw new ValidationError("El precio debe ser positivo y tener como máximo dos decimales.")
  if (!photos.length) throw new ValidationError("Agrega una foto de portada.")
  return productInput({ ...fields, price: Number(fields.price.replace(",", ".")), specs: parsedSpecs(fields.category, fields.specs), main_image: photos[0], gallery_images: photos.slice(1) }, id)
}
