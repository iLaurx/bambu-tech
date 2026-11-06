"use client"

import { SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BRANDS, PRICE_RANGES, type Brand, type PriceRangeValue } from "@/lib/products"
import { cn } from "@/lib/utils"

type CatalogFiltersProps = {
  brand: "Todos" | Brand
  onBrandChange: (brand: "Todos" | Brand) => void
  priceRange: PriceRangeValue
  onPriceRangeChange: (value: PriceRangeValue) => void
}

const priceItems = PRICE_RANGES.map(({ value, label }) => ({ value, label }))

export function CatalogFilters({ brand, onBrandChange, priceRange, onPriceRangeChange }: CatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Filtrar por marca"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0"
      >
        {BRANDS.map((b) => {
          const active = b === brand
          return (
            <button
              key={b}
              type="button"
              aria-pressed={active}
              onClick={() => onBrandChange(b)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted",
              )}
            >
              {b}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
        <span id="price-label" className="sr-only">
          Rango de precio
        </span>
        <Select
          items={priceItems}
          value={priceRange}
          onValueChange={(value) => value && onPriceRangeChange(value as PriceRangeValue)}
        >
          <SelectTrigger aria-labelledby="price-label" className="h-9 min-w-48 rounded-full bg-card px-4">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priceItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
