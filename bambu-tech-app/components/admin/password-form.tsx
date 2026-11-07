"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminRequest, errorMessage } from "./api"

export function PasswordForm({ onDone, onError, disabled, onBusyChange }: { onDone: (updated: boolean) => void; onError: (error: unknown) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked.current || disabled || !ready) return
    const form = event.currentTarget
    const values = new FormData(form)
    const password = String(values.get("new-password") ?? "")
    setError("")
    if (password.length < 12 || password.length > 128) return setError("Usa entre 12 y 128 caracteres.")
    if (password !== String(values.get("confirm-password") ?? "")) return setError("Las contraseñas no coinciden.")
    locked.current = true
    setPending(true)
    onBusyChange(true)
    try {
      await adminRequest("/api/auth/password", { method: "POST", body: JSON.stringify({ password }) })
      form.reset()
      onDone(true)
    } catch (failure) { setError(errorMessage(failure)); onError(failure) }
    finally { locked.current = false; setPending(false); onBusyChange(false) }
  }
  return <section className="rounded-xl border bg-card p-5" aria-labelledby="password-heading">
    <h2 id="password-heading" className="font-semibold">Establecer contraseña</h2>
    <p className="mt-1 text-sm text-muted-foreground">Elige una contraseña nueva de al menos 12 caracteres.</p>
    <form method="post" action="/api/auth/password" onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
      {!ready && <p role="status" className="text-sm text-muted-foreground sm:col-span-2">Preparando formulario…</p>}
      <div className="grid gap-2"><Label htmlFor="new-password">Nueva contraseña</Label><Input id="new-password" name="new-password" type="password" autoComplete="new-password" maxLength={128} disabled={!ready || pending || disabled} required /></div>
      <div className="grid gap-2"><Label htmlFor="confirm-password">Confirmar contraseña</Label><Input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" maxLength={128} disabled={!ready || pending || disabled} required /></div>
      {error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={!ready || pending || disabled}>{pending ? "Guardando…" : "Guardar contraseña"}</Button><Button type="button" variant="outline" disabled={pending || disabled} onClick={() => onDone(false)}>Volver al inventario</Button></div>
    </form>
  </section>
}
