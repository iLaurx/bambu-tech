"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, ShieldCheck } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { InventoryStats } from "@/components/admin/inventory-stats"
import { InventoryTable } from "@/components/admin/inventory-table"
import { PhoneFormDialog } from "@/components/admin/phone-form-dialog"
import { DeletePhoneDialog } from "@/components/admin/delete-phone-dialog"
import type { Product } from "@/lib/products"

export function AdminDashboard({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  function handleSave(product: Product) {
    setProducts((current) => {
      const exists = current.some((p) => p.id === product.id)
      return exists ? current.map((p) => (p.id === product.id ? product : p)) : [product, ...current]
    })
    setFormOpen(false)
  }

  function toggleSold(id: string, isSold: boolean) {
    setProducts((current) => current.map((p) => (p.id === id ? { ...p, isSold } : p)))
  }

  function confirmDelete() {
    if (!deleting) return
    setProducts((current) => current.filter((p) => p.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground">Bambu Tech</p>
              <p className="text-xs text-muted-foreground">Panel de administración</p>
            </div>
          </div>
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ver tienda</span>
            <span className="sr-only sm:hidden">Ver tienda</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Inventario</h1>
            <p className="text-sm text-muted-foreground">Administra los equipos publicados en el catálogo.</p>
          </div>
          <Button onClick={openCreate} className="self-start sm:self-auto">
            <Plus className="size-4" aria-hidden="true" />
            Agregar equipo
          </Button>
        </div>

        <InventoryStats products={products} />

        <InventoryTable
          products={products}
          onToggleSold={toggleSold}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      </main>

      <PhoneFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        onSave={handleSave}
      />

      <DeletePhoneDialog
        product={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
