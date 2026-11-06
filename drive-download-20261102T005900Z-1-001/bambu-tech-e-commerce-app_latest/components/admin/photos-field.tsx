"use client"

import { useRef, useState, type ChangeEvent } from "react"
import Image from "next/image"
import { ImagePlus, Link2, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const MAX_PHOTOS = 8
const MAX_FILE_BYTES = 5 * 1024 * 1024

type PhotosFieldProps = {
  photos: string[]
  onChange: (photos: string[]) => void
}

export function PhotosField({ photos, onChange }: PhotosFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const remaining = MAX_PHOTOS - photos.length

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    setError(null)

    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_FILE_BYTES)
    if (valid.length < files.length) setError("Algunos archivos no son imágenes o pesan más de 5 MB.")
    if (valid.length > remaining) setError(`Máximo ${MAX_PHOTOS} fotos por equipo.`)

    const added = valid.slice(0, Math.max(remaining, 0)).map((f) => URL.createObjectURL(f))
    if (added.length) onChange([...photos, ...added])
  }

  function handleAddUrl() {
    const value = url.trim()
    setError(null)
    if (!value) return
    if (!/^(https:\/\/|\/)/.test(value)) return setError("La URL debe iniciar con https:// o /.")
    if (remaining <= 0) return setError(`Máximo ${MAX_PHOTOS} fotos por equipo.`)
    if (photos.includes(value)) return setError("Esa foto ya está agregada.")
    onChange([...photos, value])
    setUrl("")
  }

  function removeAt(index: number) {
    const src = photos[index]
    if (src.startsWith("blob:")) URL.revokeObjectURL(src)
    onChange(photos.filter((_, i) => i !== index))
  }

  function makeCover(index: number) {
    onChange([photos[index], ...photos.filter((_, i) => i !== index)])
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 flex w-full items-center justify-between text-sm font-medium text-foreground">
        <span>Fotos del equipo</span>
        <span className="text-xs font-normal text-muted-foreground">
          {photos.length} / {MAX_PHOTOS}
        </span>
      </legend>

      {photos.length > 0 && (
        <ul className="grid grid-cols-4 gap-2">
          {photos.map((src, i) => (
            <li key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image src={src} alt={`Foto ${i + 1}`} fill sizes="96px" className="object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Portada
                </span>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                {i !== 0 && (
                  <PhotoAction label={`Usar foto ${i + 1} como portada`} onClick={() => makeCover(i)}>
                    <Star className="size-3.5" aria-hidden="true" />
                  </PhotoAction>
                )}
                <PhotoAction label={`Eliminar foto ${i + 1}`} onClick={() => removeAt(i)} destructive>
                  <X className="size-3.5" aria-hidden="true" />
                </PhotoAction>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFiles}
      />
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full flex-col gap-1 border-dashed py-4"
        disabled={remaining <= 0}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
        <span>Subir fotos</span>
        <span className="text-xs font-normal text-muted-foreground">Puedes elegir varias · máx. 5 MB c/u</span>
      </Button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="photo-url" className="text-xs text-muted-foreground">
          O agrega una foto por URL
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="photo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
                e.preventDefault()
                handleAddUrl()
              }}
              placeholder="https://… o /phones/equipo.png"
              className="pl-8"
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleAddUrl} disabled={remaining <= 0}>
            Agregar
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}

function PhotoAction({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
        destructive ? "hover:bg-destructive hover:text-white" : "hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  )
}
