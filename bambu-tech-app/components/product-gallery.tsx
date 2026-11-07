"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type ProductGalleryProps = {
  images: string[]
  alt: string
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const photos = images.length > 0 ? images : ["/placeholder.svg"]
  const [index, setIndex] = useState(0)
  const current = Math.min(index, photos.length - 1)
  const hasMany = photos.length > 1

  const go = (delta: number) => setIndex((current + delta + photos.length) % photos.length)

  return (
    <div className="flex h-full flex-col bg-muted">
      <div
        className="relative aspect-square md:aspect-auto md:flex-1"
        role="group"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${alt}`}
        onKeyDown={(e) => {
          if (!hasMany) return
          if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
          if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
        }}
      >
        <img
          key={photos[current]}
          src={photos[current]}
          alt={`${alt} — foto ${current + 1} de ${photos.length}`}
          className="absolute inset-0 size-full object-contain"
        />

        {hasMany && (
          <>
            <GalleryArrow direction="prev" onClick={() => go(-1)} />
            <GalleryArrow direction="next" onClick={() => go(1)} />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
              {current + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {hasMany && (
        <div className="flex gap-2 overflow-x-auto p-3" aria-label="Miniaturas">
          {photos.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === current}
              className={cn(
                "relative size-14 shrink-0 overflow-hidden rounded-lg border-2 outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
                i === current ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <img src={src} alt="" className="absolute inset-0 size-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Foto anterior" : "Foto siguiente"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur outline-none transition hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50",
        direction === "prev" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
