import { ArrowRight } from "lucide-react"
import { ConditionBadge } from "@/components/condition-badge"
import { formatMxn, imageUrl, type ProductRecord } from "@/lib/backend/contract"
import { productSpecs } from "./catalog-data"
export function ProductCard({ product, onSelect, priority }: { product: ProductRecord; onSelect: (product: ProductRecord) => void; priority?: boolean }) {
  const summary = productSpecs(product).slice(0, 2).map(spec => `${spec.label}: ${spec.value}`).join(" · ")
  return <article className="group relative flex min-w-0 h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg">
    <div className="relative aspect-square bg-muted"><img src={imageUrl(product.main_image)} alt={product.title} loading={priority ? "eager" : "lazy"} className="size-full object-contain transition-transform duration-300 group-hover:scale-105" /><ConditionBadge condition={product.condition} className="absolute left-3 top-3" />{product.is_sold && <span className="absolute bottom-3 right-3 rounded-full bg-background/95 px-3 py-1 text-sm font-semibold">Agotado</span>}</div>
    <div className="flex min-w-0 flex-1 flex-col gap-1 p-4"><p className="break-words text-xs text-muted-foreground">{product.category} · {product.brand}</p><h2 className="break-words font-semibold"><button type="button" onClick={() => onSelect(product)} className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring">{product.title}</button></h2>{summary && <p className="break-words text-sm text-muted-foreground">{summary}</p>}<div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4"><p className="text-xl font-bold tracking-tight">{formatMxn(product.price)} MXN</p><span aria-hidden="true" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Ver detalles<ArrowRight className="size-4" /></span></div></div>
  </article>
}
