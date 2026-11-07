"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, LogOut, Plus, RefreshCw, ShieldCheck } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { InventoryStats } from "./inventory-stats"
import { InventoryTable } from "./inventory-table"
import { PhoneFormDialog } from "./phone-form-dialog"
import { DeletePhoneDialog } from "./delete-phone-dialog"
import { BusinessSettings } from "./business-settings"
import { PasswordForm } from "./password-form"
import { adminRequest, AdminApiError, errorMessage, ProductAlreadySavedError } from "./api"
import type { InventoryMetrics, ProductInput, ProductRecord, PublicSettings } from "@/lib/backend/contract"

type Session = { id: string; email: string }
// Firefox may restore a button's previous disabled state before React hydrates it.
// Scope its documented restoration opt-out to this refresh button.
const refreshButtonRestoration = { autoComplete: "off" } as const
export function AdminDashboard({ recovery = false }: { recovery?: boolean }) {
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null)
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [accessLost, setAccessLost] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [deleting, setDeleting] = useState<ProductRecord | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [showPassword, setShowPassword] = useState(recovery)
  const operation = useRef(false)
  const generation = useRef(0)
  const reportError = useCallback((failure: unknown) => {
    setError(errorMessage(failure))
    if (failure instanceof AdminApiError && failure.requiresLogin) setAccessLost(true)
  }, [])
  const reload = useCallback(async () => {
    const request = ++generation.current
    setLoading(true)
    try {
      const [currentSession, rows, currentMetrics, currentSettings] = await Promise.all([
        adminRequest<Session>("/api/admin/session"), adminRequest<ProductRecord[]>("/api/admin/products"),
        adminRequest<InventoryMetrics>("/api/admin/metrics"), adminRequest<PublicSettings>("/api/catalog/settings"),
      ])
      if (request !== generation.current) return
      setSession(currentSession); setProducts(rows); setMetrics(currentMetrics); setSettings(currentSettings)
      setError(""); setAccessLost(false)
    } catch (failure) { if (request === generation.current) reportError(failure) }
    finally { if (request === generation.current) setLoading(false) }
  }, [reportError])
  useEffect(() => { void reload(); return () => { generation.current++ } }, [reload])
  useEffect(() => {
    const onFocus = () => {
      if (operation.current) return
      void adminRequest<Session>("/api/admin/session").then(value => { setSession(value); setAccessLost(false) }).catch(reportError)
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [reportError])
  async function perform(label: string, callback: () => Promise<void>) {
    if (operation.current) throw new AdminApiError("Espera a que termine la operación actual.")
    operation.current = true
    setBusy(label); setError(""); setNotice("")
    try { await callback() }
    catch (failure) { reportError(failure); throw failure }
    finally { operation.current = false; setBusy("") }
  }
  async function saveProduct(id: string, input: ProductInput, create: boolean) {
    await perform("save", async () => {
      let saved: ProductRecord
      try { saved = await adminRequest<ProductRecord>(`/api/admin/products/${id}`, { method: create ? "POST" : "PUT", body: JSON.stringify(input) }) }
      catch (failure) {
        // A lost response can follow a successful creation. Reconcile the reserved UUID before retrying.
        if (create && failure instanceof AdminApiError && [0, 409].includes(failure.status)) {
          try {
            const rows = await adminRequest<ProductRecord[]>("/api/admin/products")
            if (rows.some(row => row.id === id)) throw new ProductAlreadySavedError()
          } catch (inspection) { if (inspection instanceof ProductAlreadySavedError) throw inspection }
        }
        throw failure
      }
      setProducts(current => [saved, ...current.filter(row => row.id !== id)])
      setFormOpen(false)
      setNotice("Producto guardado.")
      await reload()
    })
  }
  async function changeStates(product: ProductRecord, active: boolean, sold: boolean) {
    try { await perform("states", async () => {
      const saved = await adminRequest<ProductRecord>(`/api/admin/products/${product.id}/states`, { method: "PATCH", body: JSON.stringify({ is_active: active, is_sold: sold }) })
      setProducts(current => current.map(row => row.id === saved.id ? saved : row))
      setNotice("Estado actualizado.")
      await reload()
    }) } catch { /* The shared alert reports the failure; retain the previous state. */ }
  }
  async function removeProduct() {
    if (!deleting) return
    const id = deleting.id
    setDeleteError("")
    try { await perform("delete", async () => {
      await adminRequest(`/api/admin/products/${id}`, { method: "DELETE", body: JSON.stringify({ confirm: true }) })
      setProducts(current => current.filter(row => row.id !== id))
      setDeleting(null)
      setNotice("Producto retirado del inventario.")
      await reload()
    }) } catch (failure) { setDeleteError(errorMessage(failure)) }
  }
  async function saveSettings(number: string | null) {
    await perform("settings", async () => {
      const saved = await adminRequest<PublicSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify({ whatsapp_number: number }) })
      setSettings(saved); setNotice("WhatsApp guardado.")
    })
  }
  async function logout() {
    try { await perform("logout", async () => { await adminRequest("/api/auth/logout", { method: "POST" }); window.location.replace("/admin/login") }) } catch { /* Keep the panel and show a retryable error if logout failed. */ }
  }
  const disabled = Boolean(busy) || loading || accessLost
  return <div className="min-h-dvh bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="rounded-lg bg-primary p-2 text-primary-foreground"><ShieldCheck className="size-5" aria-hidden="true" /></span><div><p className="text-sm font-semibold">Bambu Tech</p><p className="text-xs text-muted-foreground">Panel de administración</p></div></div><div className="flex items-center gap-2"><Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}><ArrowLeft className="size-4" />Ver tienda</Link><Button variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => void logout()}><LogOut className="size-4" />{busy === "logout" ? "Saliendo…" : "Cerrar sesión"}</Button></div></div></header>
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Inventario</h1><p className="text-sm text-muted-foreground">Administra los productos de tu tienda.</p>{session && <p className="mt-1 break-all text-xs text-muted-foreground">{session.email}</p>}</div><div className="flex flex-wrap gap-2"><Button {...refreshButtonRestoration} variant="outline" disabled={Boolean(busy) || loading} onClick={() => void reload()}><RefreshCw className="size-4" />{loading ? "Actualizando…" : "Actualizar"}</Button><Button disabled={disabled} onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="size-4" />Agregar producto</Button></div></div>
      {error && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"><p>{error}</p>{accessLost && <p className="mt-2">Tu acceso debe verificarse de nuevo. <a href="/admin/login" target="_blank" rel="noopener noreferrer" className="text-primary underline">Inicia sesión en otra pestaña</a>, vuelve aquí y pulsa Actualizar. Los formularios abiertos conservan sus datos.</p>}</div>}
      {notice && <p role="status" className="rounded-lg border bg-card p-3 text-sm text-primary">{notice}</p>}
      {showPassword && <PasswordForm disabled={disabled} onBusyChange={next => { operation.current = next; setBusy(next ? "password" : "") }} onError={reportError} onDone={updated => { setShowPassword(false); if (updated) setNotice("Contraseña actualizada."); window.history.replaceState(null, "", "/admin") }} />}
      {metrics && <InventoryStats metrics={metrics} />}
      {loading && !metrics && <p role="status" className="py-8 text-center text-muted-foreground">Cargando inventario…</p>}
      {metrics && <InventoryTable products={products} disabled={disabled} onStates={(...args) => void changeStates(...args)} onEdit={product => { setEditing(product); setFormOpen(true) }} onDelete={product => { setDeleting(product); setDeleteError("") }} />}
      {settings && <BusinessSettings key={settings.whatsapp_number ?? "unset"} number={settings.whatsapp_number} disabled={disabled} onSave={saveSettings} />}
      {!showPassword && session && <div><Button variant="ghost" disabled={disabled} onClick={() => setShowPassword(true)}>Cambiar contraseña</Button></div>}
    </main>
    <PhoneFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} onSave={saveProduct} onError={reportError} />
    <DeletePhoneDialog product={deleting} pending={busy === "delete"} error={deleteError} onOpenChange={open => { if (!open) setDeleting(null) }} onConfirm={() => void removeProduct()} />
  </div>
}
