// Run ONLY after user confirms the temporary TEST_ADMIN_PASSWORD is ready.
// Uses the real app API on an isolated local server; never prints credentials or sessions.
// Retains one test image and soft-deletes only this run's explicitly labelled test product.
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

if (!process.argv.includes("--run-approved")) {
  console.log("Prepared only. Run --run-approved after user confirmation and starting the isolated server.")
  process.exit(0)
}
try { process.loadEnvFile(".env.local") } catch { console.log(JSON.stringify({ setupReady: false })); process.exit(1) }
const password = process.env.TEST_ADMIN_PASSWORD
delete process.env.TEST_ADMIN_PASSWORD
const email = "laurocr3b@gmail.com"
const base = "http://127.0.0.1:3107"
const origin = "https://bambu.test"
if (!password || new URL(process.env.SUPABASE_URL).hostname !== "ewnzafbdmtdjnhgrbcof.supabase.co") {
  console.log(JSON.stringify({ setupReady: false }))
  process.exit(1)
}
const publicSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})
const privilegedStorage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})
const primary = new Map()
const secondary = new Map()
const productId = crypto.randomUUID()
let creationAttempted = false
let softDeleted = false
let uploaded = false
let assetPath = null
let completedChecks = 0
let failed = false
class CheckFailure extends Error {
  constructor(check, status = null) { super(check); this.check = check; this.status = status }
}
function check(label, condition, details = {}) {
  if (!condition) throw new CheckFailure(label)
  completedChecks++
  console.log(JSON.stringify({ check: label, pass: true, ...details }))
}
async function request(path, { jar = null, method = "GET", body, bytes, type, expected = 200 } = {}) {
  const headers = new Headers()
  if (method !== "GET") headers.set("Origin", origin)
  if (jar?.size) headers.set("Cookie", [...jar].map(([key, value]) => `${key}=${value}`).join("; "))
  let payload
  if (bytes !== undefined) { headers.set("Content-Type", type); payload = bytes }
  else if (body !== undefined) { headers.set("Content-Type", "application/json"); payload = JSON.stringify(body) }
  let response
  try { response = await fetch(new URL(path, base), { method, headers, body: payload, redirect: "manual", signal: AbortSignal.timeout(30000) }) }
  catch { throw new CheckFailure("app_api_connection_failed") }
  if (jar) for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0]
    const separator = pair.indexOf("=")
    if (separator < 1) continue
    const name = pair.slice(0, separator)
    const value = pair.slice(separator + 1)
    if (!value || /(?:^|;)\s*max-age=0(?:;|$)/i.test(cookie)) jar.delete(name)
    else jar.set(name, value)
  }
  if (response.status !== expected) throw new CheckFailure(`${method}_${path.replace(productId, ":test-product")}_status`, response.status)
  return response
}
async function json(path, options) {
  const response = await request(path, options)
  let result
  try { result = await response.json() } catch { throw new CheckFailure("app_api_invalid_json") }
  if (result.error) throw new CheckFailure("app_api_reported_error")
  return result.data
}
async function login(jar) {
  const result = await json("/api/auth/login", { jar, method: "POST", body: { email, password } })
  check(jar === primary ? "primary_login" : "independent_session_login", result.authenticated === true && jar.size > 0)
}
async function states(active, sold) {
  return json(`/api/admin/products/${productId}/states`, { jar: primary, method: "PATCH", body: { is_active: active, is_sold: sold } })
}
function matchesMetrics(actual, expected) {
  return ["total", "available", "sold", "views"].every(key => Number(actual[key]) === Number(expected[key]))
}
async function cleanup() {
  if (creationAttempted && !softDeleted) {
    try {
      await json(`/api/admin/products/${productId}`, { jar: primary.size ? primary : secondary, method: "DELETE", body: { confirm: true } })
      softDeleted = true
      console.log(JSON.stringify({ cleanupSoftDelete: true }))
    } catch { console.log(JSON.stringify({ cleanupSoftDelete: false, operatorReviewRequired: true, testProductId: productId })) }
  }
  for (const jar of [primary, secondary]) {
    if (!jar.size) continue
    try { await json("/api/auth/logout", { jar, method: "POST" }) }
    catch { console.log(JSON.stringify({ cleanupLogoutCompleted: false })) }
    jar.clear()
  }
}
try {
  await request("/api/admin/session", { expected: 401 })
  await request("/api/admin/products", { expected: 401 })
  const anonymousAdmin = await request("/admin", { expected: 303 })
  if (new URL(anonymousAdmin.headers.get("location"), base).pathname !== "/admin/login") throw new CheckFailure("anonymous_admin_login_redirect")
  check("anonymous_admin_denied", true)
  const settings = await json("/api/catalog/settings")
  check("approved_whatsapp_persisted", settings.whatsapp_number === "+523343950458")

  await login(primary)
  const session = await json("/api/admin/session", { jar: primary })
  check("admin_allowlist_verified_by_session", session.email?.toLowerCase() === email)
  await request("/admin", { jar: primary })
  check("admin_page_access", true)
  const baselineMetrics = await json("/api/admin/metrics", { jar: primary })
  const baselineRows = await json("/api/admin/products", { jar: primary })
  check("baseline_metrics_read", ["total", "available", "sold", "views"].every(key => Number.isFinite(Number(baselineMetrics[key]))))
  const savedSettings = await json("/api/admin/settings", { jar: primary, method: "PUT", body: { whatsapp_number: "+523343950458" } })
  check("authorized_settings_write_same_value", savedSettings.whatsapp_number === "+523343950458")

  await request(`/api/admin/uploads/${productId}`, { jar: primary, method: "POST", bytes: Buffer.alloc(4194305), type: "image/png", expected: 400 })
  check("upload_over_4mib_rejected", true)
  const fixture = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#008060" } }).png().toBuffer()
  const image = await json(`/api/admin/uploads/${productId}`, { jar: primary, method: "POST", bytes: fixture, type: "image/png", expected: 201 })
  uploaded = true
  assetPath = image.path
  check("real_storage_upload_validated", typeof image.path === "string" && image.path.startsWith(`${productId}/`) && image.path.endsWith(".webp"))
  const input = { title: `PRUEBA BACKEND ${productId.slice(0, 8)}`, category: "Otros", brand: "PRUEBA",
    price: 12.34, condition: "Nuevo", description: "Registro sintético de verificación autorizada; no es inventario comercial.",
    specs: { features: "Prueba automatizada del backend" }, main_image: image.path, gallery_images: [], is_active: false, is_sold: false }
  creationAttempted = true
  const created = await json(`/api/admin/products/${productId}`, { jar: primary, method: "POST", body: input, expected: 201 })
  check("create_hidden_product", created.id === productId && created.is_active === false && created.is_sold === false)
  await request(`/api/catalog/products/${productId}`, { expected: 404 })
  await request(image.url, { expected: 404 })
  check("hidden_product_and_image_denied_publicly", true)

  await login(secondary)
  let rows = await json("/api/admin/products", { jar: secondary })
  check("persists_between_independent_sessions", rows.some(row => row.id === productId && row.price === 12.34))
  const updatedInput = { ...input, title: `${input.title} EDITADO`, price: 23.45 }
  const edited = await json(`/api/admin/products/${productId}`, { jar: primary, method: "PUT", body: updatedInput })
  rows = await json("/api/admin/products", { jar: secondary })
  check("edit_persists_across_sessions", edited.price === 23.45 && rows.some(row => row.id === productId && row.title === updatedInput.title && row.price === 23.45))

  await states(true, false)
  const published = await json(`/api/catalog/products/${productId}`)
  check("active_product_public", published.is_active === true && published.is_sold === false)
  const availableMetrics = await json("/api/admin/metrics", { jar: secondary })
  check("active_unsold_increases_available", matchesMetrics(availableMetrics, { ...baselineMetrics, total: Number(baselineMetrics.total) + 1, available: Number(baselineMetrics.available) + 1 }))
  const publicImage = await request(image.url)
  const delivered = Buffer.from(await publicImage.arrayBuffer())
  const metadata = await sharp(delivered).metadata()
  check("real_image_delivery_webp_under_4mib", publicImage.headers.get("content-type") === "image/webp" && /no-store/.test(publicImage.headers.get("cache-control")) && metadata.format === "webp" && delivered.length <= 4194304)
  const blockedDownload = await publicSupabase.storage.from("bambu-products").download(assetPath)
  check("direct_public_storage_download_denied", Boolean(blockedDownload.error) && !blockedDownload.data)
  const blockedSigning = await publicSupabase.storage.from("bambu-products").createSignedUrl(assetPath, 60)
  check("direct_public_storage_signing_denied", Boolean(blockedSigning.error) && !blockedSigning.data?.signedUrl)

  const initialViews = Number(published.views_count)
  await Promise.all(Array.from({ length: 20 }, () => json(`/api/catalog/products/${productId}/views`, { method: "POST" })))
  const counted = await json(`/api/catalog/products/${productId}`)
  check("twenty_concurrent_views_preserved", Number(counted.views_count) === initialViews + 20, { concurrentIncrements: 20 })
  await states(true, true)
  const sold = await json(`/api/catalog/products/${productId}`)
  check("active_sold_remains_public", sold.is_active === true && sold.is_sold === true)
  const soldMetrics = await json("/api/admin/metrics", { jar: secondary })
  check("metrics_include_sold_and_views", matchesMetrics(soldMetrics, { ...baselineMetrics, total: Number(baselineMetrics.total) + 1, sold: Number(baselineMetrics.sold) + 1, views: Number(baselineMetrics.views) + initialViews + 20 }))
  await states(false, true)
  await request(`/api/catalog/products/${productId}`, { expected: 404 })
  await request(image.url, { expected: 404 })
  const publicRows = await json("/api/catalog/products")
  check("hidden_sold_excluded_from_public_list", !publicRows.some(row => row.id === productId))
  await json(`/api/catalog/products/${productId}/views`, { method: "POST" })
  rows = await json("/api/admin/products", { jar: secondary })
  check("hidden_view_not_incremented", Number(rows.find(row => row.id === productId)?.views_count) === initialViews + 20)

  await json(`/api/admin/products/${productId}`, { jar: primary, method: "DELETE", body: { confirm: true } })
  softDeleted = true
  rows = await json("/api/admin/products", { jar: secondary })
  check("soft_delete_excluded_from_admin", !rows.some(row => row.id === productId))
  const finalMetrics = await json("/api/admin/metrics", { jar: secondary })
  check("soft_deleted_excluded_from_metrics", matchesMetrics(finalMetrics, baselineMetrics))
  const retained = await privilegedStorage.storage.from("bambu-products").list(productId, { limit: 10 })
  check("test_file_retained_by_policy", !retained.error && retained.data?.some(object => object.name === assetPath.split("/")[1]))
  check("preexisting_inventory_untouched", baselineRows.every(before => rows.some(after => after.id === before.id && after.title === before.title && after.price === before.price && after.is_active === before.is_active && after.is_sold === before.is_sold)))

  await json("/api/auth/logout", { jar: primary, method: "POST" })
  await request("/api/admin/session", { jar: primary, expected: 401 })
  check("local_logout_removes_access", primary.size === 0)
  const remainingSession = await json("/api/admin/session", { jar: secondary })
  check("other_session_survives_local_logout", remainingSession.email?.toLowerCase() === email)
} catch (error) {
  failed = true
  console.log(JSON.stringify({ pass: false, check: error instanceof CheckFailure ? error.check : "unexpected_failure_sanitized", status: error instanceof CheckFailure ? error.status : null }))
} finally {
  await cleanup()
  console.log(JSON.stringify({ completedChecks, passed: !failed, testProductId: productId, softDeleted, testImageRetained: uploaded, persistedSessions: false }))
}
if (failed) process.exitCode = 1
