"use client"

import { useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { whatsappInput } from "@/lib/backend/validation"
import { errorMessage } from "./api"

export function BusinessSettings({ number, disabled, onSave }: { number: string | null; disabled: boolean; onSave: (number: string | null) => Promise<void> }) {
  const [value, setValue] = useState(number ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const locked = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (locked.current || disabled) return
    setError("")
    let normalized: string | null
    try { normalized = whatsappInput(value) } catch (failure) { setError(errorMessage(failure)); return }
    locked.current = true
    setPending(true)
    try { await onSave(normalized); setValue(normalized ?? "") }
    catch (failure) { setError(errorMessage(failure)) }
    finally { locked.current = false; setPending(false) }
  }
  return <section className="rounded-xl border bg-card p-5" aria-labelledby="business-heading"><h2 id="business-heading" className="font-semibold">Contacto de la tienda</h2><form method="post" onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" noValidate><div className="grid flex-1 gap-2"><Label htmlFor="whatsapp">Número de WhatsApp</Label><Input id="whatsapp" value={value} onChange={event => setValue(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="+52…" maxLength={30} disabled={pending || disabled} /><p className="text-xs text-muted-foreground">Incluye + y código de país. Vacío deshabilita el contacto de la tienda.</p></div><Button type="submit" disabled={pending || disabled}>{pending ? "Guardando…" : "Guardar WhatsApp"}</Button></form>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</section>
}
