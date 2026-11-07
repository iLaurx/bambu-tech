"use client"

import { BatteryFull, Cpu, HardDrive, MemoryStick, Palette, Unlock } from "lucide-react"
import { ProductGallery } from "@/components/product-gallery"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ConditionBadge } from "@/components/condition-badge"
import { WhatsAppIcon } from "@/components/whatsapp-icon"
import { buildWhatsAppUrl, formatPrice, type Product } from "@/lib/products"

type ProductDetailDialogProps = {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const batteryFormatter = new Intl.NumberFormat("es-MX")

export function ProductDetailDialog({ product, open, onOpenChange }: ProductDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        {product && (
          <div className="grid md:grid-cols-2">
            <ProductGallery key={product.id} images={product.images} alt={product.model} />

            <div className="flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-2">
                <ConditionBadge condition={product.condition} />
                <DialogTitle className="text-2xl font-semibold tracking-tight text-balance">
                  {product.model}
                </DialogTitle>
                <p className="text-2xl font-bold text-primary">{formatPrice(product.price)}</p>
              </div>

              <DialogDescription className="leading-relaxed text-pretty">{product.description}</DialogDescription>

              <section aria-labelledby="specs-heading">
                <h3 id="specs-heading" className="mb-2 text-sm font-semibold">
                  Especificaciones
                </h3>
                <dl className="divide-y rounded-xl border">
                  {product.color && <SpecRow icon={Palette} label="Color" value={product.color} />}
                  <SpecRow icon={Cpu} label="Procesador" value={product.processor} />
                  <SpecRow icon={MemoryStick} label="Memoria RAM" value={`${product.ram} GB`} />
                  <SpecRow icon={HardDrive} label="Almacenamiento (ROM)" value={`${product.storage} GB`} />
                  <SpecRow
                    icon={BatteryFull}
                    label="Capacidad de batería"
                    value={`${batteryFormatter.format(product.battery)} mAh`}
                  />
                  <SpecRow
                    icon={Unlock}
                    label="Desbloqueado para cualquier compañía"
                    value={product.unlocked ? "Sí" : "No"}
                  />
                </dl>
              </section>

              <a
                href={buildWhatsAppUrl(product.model)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 font-semibold text-whatsapp-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <WhatsAppIcon className="size-5" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <dt className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</dt>
      <dd className="shrink-0 text-right text-sm font-medium">{value}</dd>
    </div>
  )
}
