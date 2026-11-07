// Non-destructive checks against the specifically authorized test project.
// Optional approved mutation: configure only settings.id=1 WhatsApp. No grants/users/files are changed.
import { createClient } from "@supabase/supabase-js"
try { process.loadEnvFile(".env.local") } catch { console.log("Environment unavailable"); process.exit(1) }
if (new URL(process.env.SUPABASE_URL).hostname !== "ewnzafbdmtdjnhgrbcof.supabase.co") {
  console.log("Unexpected project; no requests made")
  process.exit(1)
}
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) } }
const anonymous = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, options)
const privileged = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options)
function summary(result) {
  return { status: result.status ?? null, errorCode: /^[A-Za-z0-9_]+$/.test(result.error?.code ?? "") ? result.error.code : null, denied: result.error?.code === "42501" }
}
const nonexistentId = "00000000-0000-4000-8000-000000000000"
const checks = [
  ["publicSettings", async () => {
    const result = await anonymous.from("settings").select("id,whatsapp_number").eq("id", 1).single()
    return { ...summary(result), rowExists: Boolean(result.data), whatsappMatchesApproved: result.data?.whatsapp_number === "+523343950458" }
  }],
  // Impossible keys ensure no row can change even if a security regression is detected.
  ["anonymousSettingsWriteDenied", async () => summary(await anonymous.from("settings").update({ whatsapp_number: null }).eq("id", 0))],
  ["anonymousProductsWriteDenied", async () => summary(await anonymous.from("products").update({ is_active: false }).eq("id", nonexistentId))],
  ["anonymousMetricsDenied", async () => summary(await anonymous.rpc("inventory_metrics"))],
  ["anonymousSettingsRpcDenied", async () => summary(await anonymous.rpc("save_whatsapp", { p_number: null }))],
  ["anonymousStatesRpcDenied", async () => summary(await anonymous.rpc("set_product_states", { p_id: nonexistentId, p_is_active: false, p_is_sold: false }))],
  ["anonymousAssetRegistrationDenied", async () => summary(await anonymous.rpc("register_asset", { p_id: nonexistentId, p_product_id: nonexistentId, p_uploaded_by: nonexistentId }))],
  ["anonymousImageUnreferencedHidden", async () => {
    const result = await anonymous.rpc("image_path", { p_id: nonexistentId })
    return { ...summary(result), pathAbsent: result.data === null }
  }],
  ["anonymousViewsNonexistentSafe", async () => summary(await anonymous.rpc("increment_product_views", { p_id: nonexistentId }))],
  ["anonymousStorageListing", async () => {
    const result = await anonymous.storage.from("bambu-products").list("", { limit: 1 })
    return { errorPresent: Boolean(result.error), hasVisibleEntries: Boolean(result.data?.length) }
  }],
]
for (const [name, check] of checks) {
  try { console.log(JSON.stringify({ [name]: await check() })) }
  catch { console.log(JSON.stringify({ [name]: { connectionFailed: true } })) }
}
if (process.argv.includes("--apply-approved-whatsapp")) {
  try {
    const result = await privileged.from("settings").update({ whatsapp_number: "+523343950458" }).eq("id", 1).select("id")
    console.log(JSON.stringify({ approvedWhatsappUpdate: { ...summary(result), updatedRow: result.data?.some(row => row.id === 1) ?? false } }))
  } catch { console.log(JSON.stringify({ approvedWhatsappUpdate: { connectionFailed: true } })) }
}
