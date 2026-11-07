"use client"
import { ProductGallery } from "@/components/product-gallery"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ConditionBadge } from "@/components/condition-badge"
import { WhatsAppIcon } from "@/components/whatsapp-icon"
import { formatMxn, imageUrl, whatsAppUrl, type ProductRecord, type PublicSettings } from "@/lib/backend/contract"
import { productSpecs } from "./catalog-data"
type Props = { product: ProductRecord | null; open: boolean; onOpenChange: (open: boolean) => void; loading: boolean; error: string; onRetry: () => void; settings: PublicSettings | null; settingsError: string; onRetrySettings: () => void }
export function ProductDetailDialog({ product, open, onOpenChange, loading, error, onRetry, settings, settingsError, onRetrySettings }: Props) {
  const specs = product ? productSpecs(product) : []
  const contact = product && settings ? whatsAppUrl(settings, product) : null
  return <Dialog open={open} onOpenChange={(next, details) => {
    // A card double-click may land its second press on the newly mounted backdrop.
    if (!next && details.reason === "outside-press" && "detail" in details.event && Number(details.event.detail) > 1) return
    onOpenChange(next)
  }}><DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
    {!product ? <div className="grid gap-3 p-6"><DialogTitle>Detalle del producto</DialogTitle><DialogDescription>{loading ? "Cargando información actualizada…" : error || "No hay información disponible."}</DialogDescription>{!loading && error && <button type="button" className="text-left text-primary underline" onClick={onRetry}>Reintentar detalle</button>}</div> : <div className="grid md:grid-cols-2">
      <ProductGallery key={product.id} images={[product.main_image, ...product.gallery_images.slice(0, 3)].map(imageUrl)} alt={product.title} />
      <div className="flex min-w-0 flex-col gap-5 p-6"><div className="grid min-w-0 gap-2"><div className="flex flex-wrap gap-2"><ConditionBadge condition={product.condition} />{product.is_sold && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">Agotado</span>}</div><p className="[overflow-wrap:anywhere] text-sm text-muted-foreground">{product.category} · {product.brand}</p><DialogTitle className="[overflow-wrap:anywhere] text-2xl font-semibold">{product.title}</DialogTitle><p className="text-2xl font-bold text-primary">{formatMxn(product.price)} MXN</p></div>
      <DialogDescription className="whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">{product.description || "Descripción no disponible."}</DialogDescription>
      <section aria-labelledby="specs-heading"><h3 id="specs-heading" className="mb-2 text-sm font-semibold">Especificaciones</h3>{specs.length ? <dl className="divide-y rounded-xl border">{specs.map(spec => <div key={spec.key} className="grid gap-1 px-3 py-2.5"><dt className="text-sm text-muted-foreground">{spec.label}</dt><dd className="[overflow-wrap:anywhere] text-sm font-medium">{spec.value}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Especificaciones no disponibles.</p>}</section>
      {contact ? <a href={contact} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-3 font-semibold text-whatsapp-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><WhatsAppIcon className="size-5" />Contactar por WhatsApp</a> : <div className="grid gap-2 rounded-xl border p-3"><p role="status" className="text-sm text-muted-foreground">{settingsError || "El contacto por WhatsApp todavía no está disponible."}</p><button type="button" className="text-left text-sm text-primary underline" onClick={onRetrySettings}>Actualizar contacto</button></div>}
      </div></div>}
  </DialogContent></Dialog>
}
