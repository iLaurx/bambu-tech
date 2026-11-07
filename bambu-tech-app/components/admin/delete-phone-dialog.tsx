"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { ProductRecord } from "@/lib/backend/contract"

type Props = { product: ProductRecord | null; pending: boolean; error: string; onOpenChange: (open: boolean) => void; onConfirm: () => void }
export function DeletePhoneDialog({ product, pending, error, onOpenChange, onConfirm }: Props) {
  return <AlertDialog open={product !== null} onOpenChange={open => { if (!pending) onOpenChange(open) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle><AlertDialogDescription>Se retirará <span className="font-medium">{product?.title}</span> del inventario y del catálogo. Sus archivos se conservarán. Esta operación no tiene restauración desde el panel.</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={pending} onClick={onConfirm} className="bg-destructive text-white hover:bg-destructive/90">{pending ? "Eliminando…" : "Eliminar producto"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}
