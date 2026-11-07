"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SearchX } from "lucide-react"
import { SiteHeader } from "./site-header"
import { CatalogFilters } from "./catalog-filters"
import { ProductCard } from "./product-card"
import { ProductDetailDialog } from "./product-detail-dialog"
import type { ProductRecord, PublicSettings } from "@/lib/backend/contract"
import { activeProducts, catalogBrands, CatalogError, catalogRequest, filteredProducts, type CatalogCategory, type PriceRange } from "./catalog-data"
export function Catalog({ demo = false }: { demo?: boolean }) {
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CatalogCategory>("Todos")
  const [brand, setBrand] = useState("")
  const [priceRange, setPriceRange] = useState<PriceRange>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [settingsError, setSettingsError] = useState("")
  const [selected, setSelected] = useState<ProductRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const generation = useRef(0)
  const settingsGeneration = useRef(0)
  const opening = useRef<{ id: string; counted: boolean } | null>(null)
  const detailToken = useRef(0)
  const errorText = (failure: unknown) => failure instanceof CatalogError ? failure.message : "No pudimos cargar la tienda. Inténtalo de nuevo."
  const loadSettings = useCallback(async () => {
    const current = ++settingsGeneration.current
    // Disable a previously configured contact while checking the latest setting.
    setSettings(null)
    try { const value = await catalogRequest<PublicSettings>("/api/catalog/settings"); if (current === settingsGeneration.current) { setSettings(value); setSettingsError("") } }
    catch (failure) { if (current === settingsGeneration.current) setSettingsError(errorText(failure)) }
  }, [])
  const loadProducts = useCallback(async () => {
    const current = ++generation.current
    setLoading(true)
    if (opening.current) { detailToken.current++; setSelected(null); setDetailLoading(true); setDetailError("") }
    try {
      const rows = activeProducts(await catalogRequest<ProductRecord[]>("/api/catalog/products"))
      if (current !== generation.current) return
      setProducts(rows); setError("")
      if (opening.current) {
        if (!rows.some(row => row.id === opening.current?.id)) { detailToken.current++; setSelected(null); setDetailLoading(false); setDetailError("Este producto ya no está disponible en el catálogo.") }
        else void fetchDetail()
      }
      setBrand(value => value && !catalogBrands(rows).includes(value) ? "" : value)
    } catch (failure) {
      if (current !== generation.current) return
      setError(errorText(failure)); setProducts([])
      if (opening.current) { detailToken.current++; setSelected(null); setDetailLoading(false); setDetailError("No pudimos verificar la disponibilidad. Actualiza la tienda para volver a intentarlo.") }
    } finally { if (current === generation.current) setLoading(false) }
  }, [])
  useEffect(() => {
    void loadProducts(); void loadSettings()
    const refresh = () => { void loadProducts(); void loadSettings() }
    window.addEventListener("focus", refresh)
    return () => { generation.current++; settingsGeneration.current++; detailToken.current++; window.removeEventListener("focus", refresh) }
  }, [loadProducts, loadSettings])
  async function fetchDetail() {
    const visit = opening.current
    if (!visit) return
    const token = ++detailToken.current
    setSelected(null); setDetailError(""); setDetailLoading(true)
    try {
      const product = await catalogRequest<ProductRecord>(`/api/catalog/products/${visit.id}`)
      if (token !== detailToken.current || opening.current !== visit) return
      if (!product.is_active) throw new CatalogError("Este producto ya no está disponible en el catálogo.", 404)
      setSelected(product)
      setProducts(rows => rows.map(row => row.id === product.id ? product : row))
      if (!visit.counted) {
        visit.counted = true
        // One attempt per successful opening, outside React effects. An ambiguous write is never retried.
        void catalogRequest(`/api/catalog/products/${product.id}/views`, "POST").catch(() => {})
      }
    } catch (failure) {
      if (token !== detailToken.current || opening.current !== visit) return
      if (failure instanceof CatalogError && failure.status === 404) setProducts(rows => rows.filter(row => row.id !== visit.id))
      setDetailError(errorText(failure))
    } finally { if (token === detailToken.current) setDetailLoading(false) }
  }
  function openProduct(product: ProductRecord) {
    if (opening.current) return
    opening.current = { id: product.id, counted: false }
    setDialogOpen(true); void fetchDetail()
  }
  function closeDetail(open: boolean) { setDialogOpen(open); if (!open) { opening.current = null; detailToken.current++; setSelected(null) } }
  const brands = useMemo(() => catalogBrands(products), [products])
  const visible = useMemo(() => filteredProducts(products, query, category, brand, priceRange), [products, query, category, brand, priceRange])
  const reset = () => { setQuery(""); setCategory("Todos"); setBrand(""); setPriceRange("all") }
  return <><div className="bamboo-leaves" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="bamboo-growth" aria-hidden="true"><i /><i /></div><SiteHeader query={query} onQueryChange={setQuery} /><main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    {demo && <p role="status" className="mb-6 rounded-xl border p-4 text-sm font-medium">Demostración: productos y precios de ejemplo. No representan inventario real.</p>}
    <div className="mb-6 grid gap-1"><h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Tecnología nueva y reacondicionada</h1><p className="text-muted-foreground">Explora celulares, bocinas, relojes y más.</p></div>
    <CatalogFilters category={category} onCategoryChange={setCategory} brands={brands} brand={brand} onBrandChange={setBrand} priceRange={priceRange} onPriceRangeChange={setPriceRange} />
    {settingsError && <div className="mt-5 rounded-xl border p-3 text-sm"><p>El contacto por WhatsApp no está disponible por el momento.</p><button type="button" onClick={() => void loadSettings()} className="mt-1 text-primary underline">Reintentar contacto</button></div>}
    {error ? <div role="alert" className="mt-6 rounded-xl border p-6"><p>{error}</p><button type="button" onClick={() => void loadProducts()} className="mt-2 text-primary underline">Reintentar catálogo</button></div> : loading && !products.length ? <p role="status" className="py-16 text-center text-muted-foreground">Cargando catálogo…</p> : <><p className="mb-4 mt-6 text-sm text-muted-foreground" aria-live="polite">{visible.length} {visible.length === 1 ? "producto" : "productos"}</p>{visible.length ? <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">{visible.map((product, index) => <li key={product.id} className="min-w-0"><ProductCard product={product} onSelect={openProduct} priority={index < 4} /></li>)}</ul> : <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center"><SearchX className="size-8 text-muted-foreground" /><p className="font-medium">{products.length ? "No encontramos productos con esos filtros" : "Todavía no hay productos publicados"}</p>{products.length > 0 && <button type="button" onClick={reset} className="text-sm text-primary underline">Limpiar filtros</button>}</div>}</>}
  </main><footer className="border-t"><div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground">© {new Date().getFullYear()} Bambu Tech</div></footer><ProductDetailDialog product={selected} open={dialogOpen} onOpenChange={closeDetail} loading={detailLoading} error={detailError} onRetry={() => void fetchDetail()} settings={settings} settingsError={settingsError} onRetrySettings={() => void loadSettings()} /></>
}
