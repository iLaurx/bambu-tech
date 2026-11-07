"use client"

import { PackageOpen, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConditionBadge } from "@/components/condition-badge"
import { formatMxn, imageUrl, type ProductRecord } from "@/lib/backend/contract"

type Props = {
  products: ProductRecord[]; disabled: boolean
  onStates: (product: ProductRecord, active: boolean, sold: boolean) => void
  onEdit: (product: ProductRecord) => void; onDelete: (product: ProductRecord) => void
}
export function InventoryTable({ products, disabled, onStates, onEdit, onDelete }: Props) {
  if (!products.length) return <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-16 text-center"><PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">No hay productos en el inventario</p><p className="text-sm text-muted-foreground">Agrega tu primer producto para empezar.</p></div>
  return <section aria-label="Lista de inventario" className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-4">Producto</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Vistas</TableHead><TableHead>Visibilidad</TableHead><TableHead>Disponibilidad</TableHead><TableHead className="pr-4 text-right"><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{products.map(product => <TableRow key={product.id}>
    <TableCell className="pl-4"><div className="flex items-center gap-3"><img src={imageUrl(product.main_image)} alt="" className="size-11 shrink-0 rounded-md bg-muted object-contain" /><div className="min-w-32 max-w-56"><p className="truncate font-medium" title={product.title}>{product.title}</p><p className="truncate text-xs text-muted-foreground" title={product.brand}>{product.brand}</p><ConditionBadge condition={product.condition} /></div></div></TableCell>
    <TableCell>{product.category}</TableCell><TableCell className="text-right font-medium tabular-nums">{formatMxn(product.price)}</TableCell><TableCell className="text-right tabular-nums">{product.views_count}</TableCell>
    <TableCell><div className="flex items-center gap-2"><Switch disabled={disabled} checked={product.is_active} onCheckedChange={active => onStates(product, active, product.is_sold)} aria-label={`Visible: ${product.title}`} /><span className="text-xs">{product.is_active ? "Visible" : "Oculto"}</span></div></TableCell>
    <TableCell><div className="flex items-center gap-2"><Switch disabled={disabled} checked={product.is_sold} onCheckedChange={sold => onStates(product, product.is_active, sold)} aria-label={`Agotado: ${product.title}`} /><span className="text-xs">{product.is_sold ? "Agotado" : "No agotado"}</span></div></TableCell>
    <TableCell className="pr-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" disabled={disabled} onClick={() => onEdit(product)} aria-label={`Editar ${product.title}`}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" disabled={disabled} className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(product)} aria-label={`Eliminar ${product.title}`}><Trash2 className="size-4" /></Button></div></TableCell>
  </TableRow>)}</TableBody></Table></section>
}
