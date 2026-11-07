import "server-only"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { serviceKey, supabaseConfig } from "./config"
import { BackendError, databaseError } from "./errors"

export async function sessionClient() {
  const store = await cookies()
  const { url, key } = supabaseConfig()
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => { values.forEach(({ name, value, options }) => store.set(name, value, options)) },
    },
  })
}
export function privilegedStorageClient() {
  const { url } = supabaseConfig()
  return createClient(url, serviceKey(), { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
}
export async function requireAdmin() {
  const client = await sessionClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new BackendError("UNAUTHORIZED", "Inicia sesión para continuar.", 401)
  const membership = await client.rpc("admin_session")
  databaseError(membership.error)
  if (membership.data !== true) throw new BackendError("FORBIDDEN", "Tu cuenta no tiene acceso administrativo.", 403)
  return { client, user }
}
