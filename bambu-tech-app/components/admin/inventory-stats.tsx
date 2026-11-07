import { CircleCheck, Eye, Package, Tag, type LucideIcon } from "lucide-react"
import type { InventoryMetrics } from "@/lib/backend/contract"

type Stat = { label: string; value: number; icon: LucideIcon; hint: string }
export function InventoryStats({ metrics }: { metrics: InventoryMetrics }) {
  const stats: Stat[] = [
    { label: "Total de productos", value: metrics.total, icon: Package, hint: "En inventario" },
    { label: "Disponibles", value: metrics.available, icon: CircleCheck, hint: "Visibles y no agotados" },
    { label: "Agotados", value: metrics.sold, icon: Tag, hint: "Incluye productos ocultos" },
    { label: "Vistas", value: metrics.views, icon: Eye, hint: "Aperturas de productos" },
  ]
  return <section aria-label="Resumen del inventario" className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon, hint }) => <div key={label} className="flex items-start justify-between rounded-xl border border-border bg-card p-4 sm:p-5"><div className="grid gap-1"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-semibold tabular-nums">{new Intl.NumberFormat("es-MX").format(value)}</p><p className="text-xs text-muted-foreground">{hint}</p></div><span className="rounded-lg bg-secondary p-2 text-primary"><Icon className="size-5" aria-hidden="true" /></span></div>)}</section>
}
