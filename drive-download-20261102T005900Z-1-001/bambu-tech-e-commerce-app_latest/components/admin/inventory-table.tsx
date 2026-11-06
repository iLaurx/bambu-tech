"use client"

import { PackageOpen, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConditionBadge } from "@/components/condition-badge"
import { formatPrice, type Product } from "@/lib/products"
import { cn } from "@/lib/utils"

type Props = {
  products: Product[]
  onToggleSold: (id: string, isSold: boolean) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function InventoryTable({ products, onToggleSold, onEdit, onDelete }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium text-foreground">No hay equipos en el inventario</p>
        <p className="text-sm text-muted-foreground">Agrega tu primer equipo para empezar.</p>
      </div>
    )
  }

  return (
    <section aria-label="Lista de inventario" className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Equipo</TableHead>
            <TableHead className="hidden md:table-cell">Condición</TableHead>
            <TableHead className="hidden sm:table-cell">Memoria</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const switchId = `status-${product.id}`
            return (
              <TableRow key={product.id} className={cn(product.isSold && "text-muted-foreground")}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails may use arbitrary external URLs */}
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt=""
                        className={cn("size-full object-contain", product.isSold && "opacity-50 grayscale")}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("truncate font-medium", !product.isSold && "text-foreground")}>
                        {product.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ConditionBadge condition={product.condition} />
                </TableCell>
                <TableCell className="hidden tabular-nums sm:table-cell">
                  {product.ram}GB / {product.storage}GB
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatPrice(product.price)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={switchId}
                      checked={!product.isSold}
                      onCheckedChange={(checked) => onToggleSold(product.id, !checked)}
                      aria-label={`Estado de ${product.model}`}
                    />
                    <label
                      htmlFor={switchId}
                      className={cn(
                        "w-16 cursor-pointer text-xs font-medium",
                        product.isSold ? "text-muted-foreground" : "text-primary",
                      )}
                    >
                      {product.isSold ? "Vendido" : "Activo"}
                    </label>
                  </div>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      <span className="sr-only">Editar {product.model}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="sr-only">Eliminar {product.model}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}
