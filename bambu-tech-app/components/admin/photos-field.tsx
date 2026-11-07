"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { ImagePlus, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { imageUrl, MAX_IMAGE_BYTES } from "@/lib/backend/contract"
import { adminRequest, AdminApiError, errorMessage } from "./api"

export const MAX_PHOTOS = 4
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]
type Props = {
  productId: string; photos: string[]; onChange: (photos: string[]) => void
  disabled?: boolean; onBusyChange: (busy: boolean) => void; onError: (error: unknown) => void
}

export function PhotosField({ productId, photos, onChange, disabled, onBusyChange, onError }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState<File[]>([])
  const [error, setError] = useState("")
  const [needsLogin, setNeedsLogin] = useState(false)
  async function upload(files: File[]) {
    if (locked.current || disabled || !files.length) return
    locked.current = true
    setPending(true)
    onBusyChange(true)
    setError("")
    setNeedsLogin(false)
    const added: string[] = []
    const selected = files.slice(0, MAX_PHOTOS - photos.length)
    let index = 0
    try {
      for (; index < selected.length; index++) {
        const file = selected[index]
        const result = await adminRequest<{ path: string }>(`/api/admin/uploads/${productId}`, { method: "POST", body: file, headers: { "Content-Type": file.type } })
        added.push(result.path)
        onChange([...photos, ...added])
      }
      setFailed([])
    } catch (failure) {
      setFailed(selected.slice(index))
      setNeedsLogin(failure instanceof AdminApiError && failure.requiresLogin)
      setError(`${errorMessage(failure)} Las fotos cargadas se conservan; puedes reintentar las pendientes.`)
      onError(failure)
    } finally { locked.current = false; setPending(false); onBusyChange(false) }
  }
  function select(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    setError("")
    if (files.some(file => !ACCEPTED.includes(file.type) || file.size > MAX_IMAGE_BYTES || file.size === 0)) {
      setError("Selecciona únicamente imágenes JPEG, PNG o WebP de hasta 4 MiB cada una.")
      return
    }
    if (files.length > MAX_PHOTOS - photos.length) {
      setError("Se permite una portada y hasta tres fotos secundarias. Selecciona menos archivos.")
      return
    }
    setFailed([])
    void upload(files)
  }
  const busy = pending || disabled
  return <fieldset className="grid gap-3" disabled={busy}>
    <legend className="mb-2 flex w-full justify-between text-sm font-medium"><span>Fotos del producto</span><span className="text-muted-foreground">{photos.length} / {MAX_PHOTOS}</span></legend>
    <p className="text-xs text-muted-foreground">La primera foto es la portada. JPEG, PNG o WebP; máximo 4 MiB por imagen.</p>
    {photos.length > 0 && <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((path, index) => <li key={path} className="relative overflow-hidden rounded-lg border bg-muted">
      {/* Authenticated image requests bypass image optimization and caches. */}
      <img src={imageUrl(path)} alt={`Foto ${index + 1} del producto`} className="aspect-square w-full object-contain" />
      <span className="absolute bottom-1 left-1 rounded bg-background/95 px-1.5 text-xs">{index === 0 ? "Portada" : `Foto ${index + 1}`}</span>
      <div className="absolute right-1 top-1 flex gap-1">
        {index > 0 && <button type="button" className="rounded-full bg-background p-1.5 shadow" aria-label={`Usar foto ${index + 1} como portada`} onClick={() => onChange([path, ...photos.filter(item => item !== path)])}><Star className="size-4" /></button>}
        <button type="button" className="rounded-full bg-background p-1.5 shadow" aria-label={`Retirar foto ${index + 1}`} onClick={() => onChange(photos.filter(item => item !== path))}><X className="size-4" /></button>
      </div>
    </li>)}</ul>}
    <input ref={input} className="sr-only" type="file" accept={ACCEPTED.join(",")} multiple onChange={select} aria-label="Elegir fotos del producto" tabIndex={-1} />
    <Button type="button" variant="outline" disabled={busy || photos.length >= MAX_PHOTOS} onClick={() => input.current?.click()}><ImagePlus className="size-4" />{pending ? "Cargando fotos…" : "Subir fotos"}</Button>
    {failed.length > 0 && <Button type="button" variant="secondary" disabled={busy || photos.length >= MAX_PHOTOS} onClick={() => void upload(failed)}>Reintentar {failed.length} {failed.length === 1 ? "foto pendiente" : "fotos pendientes"}</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {needsLogin && <a href="/admin/login" target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Iniciar sesión en otra pestaña y volver a reintentar las fotos</a>}
  </fieldset>
}
