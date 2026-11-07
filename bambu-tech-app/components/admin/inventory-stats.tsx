import { CircleCheck, Smartphone, Tag, type LucideIcon } from "lucide-react"
import type { Product } from "@/lib/products"

type Stat = { label: string; value: number; icon: LucideIcon; hint: string }

export function InventoryStats({ products }: { products: Product[] }) {
  const sold = products.filter((p) => p.isSold).length
  const active = products.length - sold

  const stats: Stat[] = [
    { label: "Total de equipos", value: products.length, icon: Smartphone, hint: "En inventario" },
    { label: "Publicaciones activas", value: active, icon: CircleCheck, hint: "Visibles en la tienda" },
    { label: "Vendidos", value: sold, icon: Tag, hint: "Ocultos del catálogo" },
  ]

  return (
    <section aria-label="Resumen del inventario" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, hint }) => (
        <div key={label} className="flex items-start justify-between rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>
      ))}
    </section>
  )
}
