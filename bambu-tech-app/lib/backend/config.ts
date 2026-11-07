import "server-only"
import { BackendError } from "./errors"
const unavailable = () => new BackendError("UNAVAILABLE", "El servicio todavía no está configurado.", 503)
export function supabaseConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw unavailable()
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["127.0.0.1", "localhost"].includes(parsed.hostname) && parsed.protocol === "http:")) throw unavailable()
    if (!key.startsWith("sb_publishable_")) {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
      if (payload.role !== "anon") throw unavailable()
    }
  } catch { throw unavailable() }
  return { url, key }
}
export function serviceKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw unavailable()
  try {
    if (!value.startsWith("sb_secret_") && JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString()).role !== "service_role") throw unavailable()
  } catch { throw unavailable() }
  return value
}
export function appOrigin(): string {
  try {
    const url = new URL(process.env.APP_ORIGIN ?? "")
    if (url.origin !== process.env.APP_ORIGIN || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol === "http:"))) throw unavailable()
    return url.origin
  } catch { throw unavailable() }
}
