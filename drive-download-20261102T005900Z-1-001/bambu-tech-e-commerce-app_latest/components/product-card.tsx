import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { ConditionBadge } from "@/components/condition-badge"
import { formatPrice, type Product } from "@/lib/products"

type ProductCardProps = {
  product: Product
  onSelect: (product: Product) => void
  priority?: boolean
}

export function ProductCard({ product, onSelect, priority }: ProductCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg">
      <div className="relative aspect-square bg-muted">
        <Image
          src={product.images[0] || "/placeholder.svg"}
          alt={product.model}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <ConditionBadge condition={product.condition} className="absolute top-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold text-balance">
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.model}
          </button>
        </h3>
        <p className="text-sm text-muted-foreground">
          {product.ram}GB RAM / {product.storage}GB ROM
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-xl font-bold tracking-tight">{formatPrice(product.price)}</p>
          <span
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            aria-hidden="true"
          >
            Ver detalles
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  )
}
