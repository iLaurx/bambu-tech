"use client"

import { useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CATEGORIES, CONDITIONS, type Category, type ProductInput, type ProductRecord } from "@/lib/backend/contract"
import { SPEC_FIELDS } from "@/lib/backend/validation"
import { PhotosField } from "./photos-field"
import { categorySpecs, formProduct, SPEC_LABELS } from "./product-form-values"
import { AdminApiError, errorMessage, ProductAlreadySavedError } from "./api"

type Props = {
  open: boolean; onOpenChange: (open: boolean) => void; product: ProductRecord | null
  onSave: (id: string, input: ProductInput, create: boolean) => Promise<void>
  onError: (error: unknown) => void
}
const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
export function PhoneFormDialog({ open, onOpenChange, product, onSave, onError }: Props) {
  const [busy, setBusy] = useState(false)
  return <Dialog open={open} onOpenChange={next => { if (!busy) onOpenChange(next) }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>{product ? "Editar producto" : "Agregar producto"}</DialogTitle><DialogDescription>Completa los datos del producto. Las especificaciones desconocidas pueden quedar vacías.</DialogDescription></DialogHeader>
      {open && <ProductForm key={product?.id ?? "new"} product={product} onSave={onSave} onError={onError} onBusyChange={setBusy} onCancel={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
}
function ProductForm({ product, onSave, onError, onBusyChange, onCancel }: Omit<Props, "open" | "onOpenChange"> & { onBusyChange: (busy: boolean) => void; onCancel: () => void }) {
  const [id] = useState(() => product?.id ?? crypto.randomUUID())
  const [creating, setCreating] = useState(!product)
  const [category, setCategory] = useState<Category>(product?.category ?? "Celulares")
  const [condition, setCondition] = useState<ProductInput["condition"]>(product?.condition ?? "Nuevo")
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(product?.specs ?? {}).map(([key, value]) => [key, String(value)])))
  const [photos, setPhotos] = useState<string[]>(() => product ? [product.main_image, ...product.gallery_images] : [])
  const [active, setActive] = useState(product?.is_active ?? false)
  const [sold, setSold] = useState(product?.is_sold ?? false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [needsLogin, setNeedsLogin] = useState(false)
  const locked = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked.current || uploading) return
    setError("")
    const data = new FormData(event.currentTarget)
    let input: ProductInput
    try {
      input = formProduct(id, { title: String(data.get("title") ?? ""), brand: String(data.get("brand") ?? ""), price: String(data.get("price") ?? ""), description: String(data.get("description") ?? ""), category, condition, specs: values, is_active: active, is_sold: sold }, photos)
    } catch (failure) { setError(errorMessage(failure)); return }
    locked.current = true
    setSaving(true)
    onBusyChange(true)
    try { await onSave(id, input, creating) }
    catch (failure) {
      if (failure instanceof ProductAlreadySavedError) setCreating(false)
      setNeedsLogin(failure instanceof AdminApiError && failure.requiresLogin)
      setError(errorMessage(failure)); onError(failure)
    }
    finally { locked.current = false; setSaving(false); onBusyChange(false) }
  }
  const busy = saving || uploading
  return <form method="post" onSubmit={submit} className="grid gap-4" noValidate>
    <fieldset disabled={busy} className="grid gap-4">
      <div className="grid gap-2"><Label htmlFor="title">Título / Modelo</Label><Input id="title" name="title" defaultValue={product?.title} maxLength={200} required placeholder="Ej. iPhone 15 Pro" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="category">Categoría</Label><select id="category" value={category} className={selectClass} onChange={event => { const next = event.target.value as Category; setCategory(next); setValues(current => categorySpecs(next, current)) }}>{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></div>
        <div className="grid gap-2"><Label htmlFor="brand">Marca</Label><Input id="brand" name="brand" defaultValue={product?.brand} maxLength={80} required placeholder="Marca del producto" /></div>
        <div className="grid gap-2"><Label htmlFor="price">Precio (MXN)</Label><Input id="price" name="price" inputMode="decimal" defaultValue={product?.price} required placeholder="11499.00" /></div>
        <div className="grid gap-2"><Label htmlFor="condition">Condición</Label><select id="condition" value={condition} className={selectClass} onChange={event => setCondition(event.target.value as ProductInput["condition"])}>{CONDITIONS.map(item => <option key={item}>{item}</option>)}</select></div>
      </div>
      <div className="grid gap-2"><Label htmlFor="description">Descripción</Label><textarea id="description" name="description" defaultValue={product?.description} maxLength={10000} rows={3} className={`${selectClass} h-auto py-2`} /></div>
      <fieldset className="rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Especificaciones de {category}</legend><div className="grid gap-4 sm:grid-cols-2">{Object.entries(SPEC_FIELDS[category]).map(([key, kind]) => <div key={key} className="grid gap-2"><Label htmlFor={`spec-${key}`}>{SPEC_LABELS[key]}</Label>{kind === "boolean" ? <select id={`spec-${key}`} value={values[key] ?? ""} className={selectClass} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))}><option value="">Sin especificar</option><option value="true">Sí</option><option value="false">No</option></select> : <Input id={`spec-${key}`} value={values[key] ?? ""} inputMode={kind === "positive" ? "decimal" : "text"} maxLength={key === "features" ? 1000 : 200} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} placeholder="Opcional" />}</div>)}</div></fieldset>
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3"><label className="flex items-center justify-between gap-3"><span className="text-sm">Visible en el catálogo</span><Switch aria-label="Visible en el catálogo" checked={active} onCheckedChange={setActive} /></label><label className="flex items-center justify-between gap-3"><span className="text-sm">Producto agotado</span><Switch aria-label="Producto agotado" checked={sold} onCheckedChange={setSold} /></label><p className="text-xs text-muted-foreground">Un producto visible y agotado permanece en el catálogo con su distintivo.</p></div>
    </fieldset>
    <PhotosField productId={id} photos={photos} onChange={setPhotos} disabled={saving} onBusyChange={next => { setUploading(next); onBusyChange(next) }} onError={onError} />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {needsLogin && <a href="/admin/login" target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Iniciar sesión en otra pestaña y volver a intentar sin perder los datos</a>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={busy}>{saving ? "Guardando…" : uploading ? "Cargando fotos…" : product ? "Guardar cambios" : "Crear producto"}</Button></DialogFooter>
  </form>
}
