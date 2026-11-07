// Read-only environment inspection. Prints only configuration booleans and sanitized results.
// Never print process.env, client objects, raw errors, headers, URLs with keys, or Auth user lists.
import { createClient } from "@supabase/supabase-js"

try { process.loadEnvFile(".env.local") } catch {
  console.log(JSON.stringify({ environmentFileReadable: false }))
  process.exit(1)
}
const url = process.env.SUPABASE_URL
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
function role(key, prefix, legacyRole) {
  if (typeof key !== "string") return false
  if (key.startsWith(prefix) && key.length > prefix.length + 10) return true
  try { return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === legacyRole } catch { return false }
}
let projectHost = null
try {
  const parsed = new URL(url)
  if (parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.search && parsed.pathname === "/") projectHost = parsed.hostname
} catch {}
let originValid = false
try { const parsed = new URL(process.env.APP_ORIGIN); originValid = parsed.origin === process.env.APP_ORIGIN } catch {}
const configuration = {
  environmentFileReadable: true, projectHost, projectUrlValid: projectHost !== null,
  publishablePresent: Boolean(publishable), publishableFormatValid: role(publishable, "sb_publishable_", "anon"),
  secretPresent: Boolean(secret), secretFormatValid: role(secret, "sb_secret_", "service_role"), originValid,
}
console.log(JSON.stringify({ configuration }))
if (!configuration.projectUrlValid || !configuration.publishableFormatValid || !configuration.secretFormatValid) process.exit(1)
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) } }
const admin = createClient(url, secret, options)
const publicClient = createClient(url, publishable, options)
function safeError(error) {
  if (!error) return null
  return { code: typeof error.code === "string" && /^[A-Za-z0-9_]+$/.test(error.code) ? error.code : null,
    status: Number.isFinite(Number(error.status ?? error.statusCode)) ? Number(error.status ?? error.statusCode) : null }
}
async function users() {
  let inspected = 0
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return { ok: false, error: safeError(error) }
    inspected += data.users.length
    const match = data.users.find(user => user.email?.toLowerCase() === "laurocr3b@gmail.com")
    if (match) return { ok: true, inspected, targetExists: true, targetUserId: match.id, emailConfirmed: Boolean(match.email_confirmed_at) }
    if (data.users.length < 1000) return { ok: true, inspected, targetExists: false }
  }
  return { ok: true, inspected, targetExists: null, inspectionTruncated: true }
}
const inspections = [
  ["productsService", () => admin.from("products").select("id").limit(1).then(result => ({ ok: !result.error, status: result.status, samplePresent: Boolean(result.data?.length), error: safeError(result.error) }))],
  ["productsPublic", () => publicClient.from("products").select("id").limit(1).then(result => ({ ok: !result.error, status: result.status, samplePresent: Boolean(result.data?.length), error: safeError(result.error) }))],
  ["settingsPublic", () => publicClient.from("settings").select("id,whatsapp_number").eq("id", 1).maybeSingle().then(result => ({ ok: !result.error, rowExists: Boolean(result.data), whatsappMatchesApproved: result.data?.whatsapp_number === "+523343950458", error: safeError(result.error) }))],
  ["bucket", () => admin.storage.getBucket("bambu-products").then(result => ({ ok: !result.error, exists: Boolean(result.data), private: result.data ? result.data.public === false : null, sizeLimitMatches: result.data ? result.data.file_size_limit === 4194304 : null, webpOnly: result.data ? JSON.stringify(result.data.allowed_mime_types) === JSON.stringify(["image/webp"]) : null, error: safeError(result.error) }))],
  ["authAdmin", users],
]
await Promise.all(inspections.map(async ([name, inspect]) => {
  try { console.log(JSON.stringify({ [name]: await inspect() })) }
  catch { console.log(JSON.stringify({ [name]: { ok: false, connectionFailed: true } })) }
}))
