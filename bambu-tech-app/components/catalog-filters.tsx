"use client"
import { CATEGORIES } from "@/lib/backend/contract"
import { cn } from "@/lib/utils"
import { PRICE_OPTIONS, type CatalogCategory, type PriceRange } from "./catalog-data"
type Props = { category: CatalogCategory; onCategoryChange: (value: CatalogCategory) => void; brands: string[]; brand: string; onBrandChange: (value: string) => void; priceRange: PriceRange; onPriceRangeChange: (value: PriceRange) => void }
export function CatalogFilters({ category, onCategoryChange, brands, brand, onBrandChange, priceRange, onPriceRangeChange }: Props) {
  return <div className="grid gap-4">
    <div role="group" aria-label="Filtrar por categoría" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{(["Todos", ...CATEGORIES] as CatalogCategory[]).map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => onCategoryChange(item)} className={cn("category-choice shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", category === item ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{item}</button>)}</div>
    <div className="flex flex-wrap gap-3"><div className="grid min-w-0 max-w-full gap-1 text-sm"><label htmlFor="catalog-brand">Marca</label><select id="catalog-brand" className="h-10 min-w-0 max-w-full rounded-full border bg-card px-4" value={brand} onChange={event => onBrandChange(event.target.value)}><option value="">Todas las marcas</option>{brands.map(item => <option key={item} value={item}>{item}</option>)}</select></div><div className="grid min-w-0 max-w-full gap-1 text-sm"><label htmlFor="catalog-price">Rango de precio</label><select id="catalog-price" className="h-10 min-w-0 max-w-full rounded-full border bg-card px-4" value={priceRange} onChange={event => onPriceRangeChange(event.target.value as PriceRange)}>{PRICE_OPTIONS.map((label, index) => <option key={label} value={index === 0 ? "all" : String(index - 1)}>{label}</option>)}</select></div></div>
  </div>
}
