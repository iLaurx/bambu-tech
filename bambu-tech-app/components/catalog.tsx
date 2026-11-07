"use client"

import { useMemo, useState } from "react"
import { SearchX } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { CatalogFilters } from "@/components/catalog-filters"
import { ProductCard } from "@/components/product-card"
import { ProductDetailDialog } from "@/components/product-detail-dialog"
import { PRICE_RANGES, type Brand, type PriceRangeValue, type Product } from "@/lib/products"

export function Catalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState<"Todos" | Brand>("Todos")
  const [priceRange, setPriceRange] = useState<PriceRangeValue>("all")
  const [selected, setSelected] = useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const range = PRICE_RANGES.find((r) => r.value === priceRange) ?? PRICE_RANGES[0]
    return products.filter(
      (p) =>
        !p.isSold &&
        (brand === "Todos" || p.brand === brand) &&
        p.price >= range.min &&
        p.price < range.max &&
        (normalizedQuery === "" || `${p.brand} ${p.model}`.toLowerCase().includes(normalizedQuery)),
    )
  }, [products, query, brand, priceRange])

  const resetFilters = () => {
    setQuery("")
    setBrand("Todos")
    setPriceRange("all")
  }

  return (
    <>
      <SiteHeader query={query} onQueryChange={setQuery} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Celulares nuevos y reacondicionados</h1>
          <p className="text-muted-foreground text-pretty">
            Equipos libres, garantizados y al mejor precio.
          </p>
        </div>

        <CatalogFilters
          brand={brand}
          onBrandChange={setBrand}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />

        <p className="mt-6 mb-4 text-sm text-muted-foreground" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "equipo disponible" : "equipos disponibles"}
        </p>

        {visibleProducts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product, index) => (
              <li key={product.id} className="flex">
                <div className="w-full">
                  <ProductCard
                    product={product}
                    priority={index < 4}
                    onSelect={(p) => {
                      setSelected(p)
                      setDialogOpen(true)
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">No encontramos equipos con esos filtros</p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Bambu Tech
        </div>
      </footer>

      <ProductDetailDialog product={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
