"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminRequest, errorMessage } from "./api"

export function AuthPanel({ mode }: { mode: "login" | "recovery" }) {
  const recovery = mode === "recovery"
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked.current) return
    const form = event.currentTarget
    const values = new FormData(form)
    const email = String(values.get("email") ?? "").trim()
    const password = String(values.get("password") ?? "")
    setError("")
    setNotice("")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return setError("Escribe un correo válido.")
    if (!recovery && (!password || password.length > 128)) return setError("Escribe tu contraseña.")
    locked.current = true
    setPending(true)
    try {
      if (recovery) {
        const result = await adminRequest<{ message: string }>("/api/auth/recovery", { method: "POST", body: JSON.stringify({ email }) })
        setNotice(result.message)
      } else {
        await adminRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
        form.reset()
        window.location.replace("/admin")
      }
    } catch (failure) { setError(errorMessage(failure)) }
    finally { locked.current = false; setPending(false) }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div className="flex items-center gap-3"><ShieldCheck className="size-9 text-primary" aria-hidden="true" /><div><p className="font-semibold">Bambu Tech</p><p className="text-sm text-muted-foreground">Administración privada</p></div></div>
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{recovery ? "Recuperar acceso" : "Iniciar sesión"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{recovery ? "Te enviaremos instrucciones si tu cuenta puede recuperar acceso. Abre el enlace en este mismo navegador." : "Ingresa con tu cuenta autorizada para administrar el inventario."}</p>
        <form method="post" action={recovery ? "/api/auth/recovery" : "/api/auth/login"} onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          {!ready && <p role="status" className="text-sm text-muted-foreground">Preparando formulario…</p>}
          <div className="grid gap-2"><Label htmlFor="email">Correo electrónico</Label><Input id="email" name="email" type="email" autoComplete="username" maxLength={254} required disabled={!ready || pending} /></div>
          {!recovery && <div className="grid gap-2"><Label htmlFor="password">Contraseña</Label><Input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required disabled={!ready || pending} /></div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-primary">{notice} Revisa también spam.</p>}
          <Button type="submit" disabled={!ready || pending}>{pending ? "Procesando…" : recovery ? "Enviar instrucciones" : "Entrar al panel"}</Button>
          <noscript><p className="text-sm text-destructive">Activa JavaScript para acceder a la administración.</p></noscript>
        </form>
        <Link className="mt-5 inline-block text-sm text-primary underline underline-offset-4" href={recovery ? "/admin/login" : "/admin/recovery"}>{recovery ? "Volver a iniciar sesión" : "Olvidé mi contraseña"}</Link>
      </section>
      <Link href="/" className="text-center text-sm text-muted-foreground underline underline-offset-4">Volver a la tienda</Link>
    </main>
  )
}
