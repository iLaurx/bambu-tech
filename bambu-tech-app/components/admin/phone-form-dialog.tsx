"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PhotosField } from "@/components/admin/photos-field"
import { BRANDS, type Brand, type Condition, type Product } from "@/lib/products"

const BRAND_OPTIONS = BRANDS.filter((b): b is Brand => b !== "Todos")
const CONDITIONS: Condition[] = ["Nuevo", "Reacondicionado"]
const RAM_OPTIONS = [2, 3, 4, 6, 8, 12, 16]
const STORAGE_OPTIONS = [32, 64, 128, 256, 512, 1024]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSave: (product: Product) => void
}

export function PhoneFormDialog({ open, onOpenChange, product, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Editar equipo" : "Agregar nuevo equipo"}</DialogTitle>
          <DialogDescription>
            {product ? "Actualiza la información del equipo." : "Completa los datos para publicarlo en el catálogo."}
          </DialogDescription>
        </DialogHeader>
        {open && <PhoneForm key={product?.id ?? "new"} product={product} onSave={onSave} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function PhoneForm({
  product,
  onSave,
  onCancel,
}: {
  product: Product | null
  onSave: (product: Product) => void
  onCancel: () => void
}) {
  const [brand, setBrand] = useState<Brand>(product?.brand ?? "Apple")
  const [condition, setCondition] = useState<Condition>(product?.condition ?? "Nuevo")
  const [ram, setRam] = useState(String(product?.ram ?? 8))
  const [storage, setStorage] = useState(String(product?.storage ?? 128))
  const [isSold, setIsSold] = useState(product?.isSold ?? false)
  const [photos, setPhotos] = useState<string[]>(product?.images ?? [])
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const model = String(data.get("model") ?? "").trim()
    const color = String(data.get("color") ?? "").trim().slice(0, 40)
    const price = Number(data.get("price"))

    if (!model) return setError("Escribe el nombre del modelo.")
    if (!color) return setError("Escribe el color del equipo.")
    if (!Number.isInteger(price) || price <= 0) return setError("El precio debe ser un número entero mayor a 0.")
    if (photos.length === 0) return setError("Agrega al menos una foto del equipo.")

    onSave({
      id: product?.id ?? crypto.randomUUID(),
      model,
      brand,
      condition,
      price,
      ram: Number(ram),
      storage: Number(storage),
      images: photos,
      color,
      isSold,
      processor: product?.processor ?? "Por definir",
      battery: product?.battery ?? 0,
      unlocked: product?.unlocked ?? true,
      description: product?.description ?? "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="model">Título / Modelo</Label>
        <Input id="model" name="model" defaultValue={product?.model} placeholder="Ej. iPhone 15 Pro" required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">Marca</Label>
          <Select value={brand} onValueChange={(v) => v && setBrand(v as Brand)}>
            <SelectTrigger id="brand" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_OPTIONS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Precio (MXN)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={product?.price}
            placeholder="11499"
            required
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            name="color"
            defaultValue={product?.color}
            placeholder="Ej. Titanio natural"
            maxLength={40}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ram">Memoria RAM</Label>
          <Select value={ram} onValueChange={(v) => v && setRam(v)}>
            <SelectTrigger id="ram" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RAM_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r} GB
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="storage">Almacenamiento</Label>
          <Select value={storage} onValueChange={(v) => v && setStorage(v)}>
            <SelectTrigger id="storage" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STORAGE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s >= 1024 ? "1 TB" : `${s} GB`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Condición</legend>
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center justify-center rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="condition"
                value={c}
                checked={condition === c}
                onChange={() => setCondition(c)}
                className="sr-only"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <PhotosField photos={photos} onChange={setPhotos} />

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div>
          <Label htmlFor="is-available">Disponible para venta</Label>
          <p className="text-xs text-muted-foreground">
            {isSold ? "Marcado como vendido: no aparece en la tienda." : "Visible en el catálogo público."}
          </p>
        </div>
        <Switch id="is-available" checked={!isSold} onCheckedChange={(checked) => setIsSold(!checked)} />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{product ? "Guardar cambios" : "Agregar equipo"}</Button>
      </DialogFooter>
    </form>
  )
}
