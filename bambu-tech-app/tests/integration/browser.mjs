// Panel-to-catalog integration in memory only. No Supabase credentials or real writes.
import assert from "node:assert/strict"
import http from "node:http"
import net from "node:net"
import { spawn, execFile } from "node:child_process"
import { chromium } from "playwright"
import sharp from "sharp"

const base = "http://127.0.0.1:3112"
const user = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "prueba@example.test", aud: "authenticated", role: "authenticated", created_at: "2026-01-01T00:00:00Z", app_metadata: { provider: "email" }, user_metadata: {} }
const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test-signature`
const cookieValue = `base64-${Buffer.from(JSON.stringify({ access_token: jwt, refresh_token: "mock-refresh", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user })).toString("base64url")}`
const cookieName = "sb-127-auth-token"
const auth = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json")
  if (req.url === "/auth/v1/user") return res.end(JSON.stringify(user))
  if (req.url === "/rest/v1/rpc/admin_session") return res.end("true")
  res.writeHead(404); res.end("{}")
})
const probe = net.createServer()
await new Promise((resolve, reject) => probe.once("error", reject).listen(3112, "127.0.0.1", resolve))
await new Promise(resolve => probe.close(resolve))
await new Promise(resolve => auth.listen(0, "127.0.0.1", resolve))
const authPort = auth.address().port
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3112"], {
  env: { ...process.env, NODE_ENV: "development", BAMBU_ADMIN_TEST: "1", APP_ORIGIN: base, SUPABASE_URL: `http://127.0.0.1:${authPort}`, SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_testing_only", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_local_testing_only" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
})
let output = ""
const capture = chunk => { output = (output + chunk.toString().replace(/([?&]code=)[^\s&]+/g, "$1[redacted]")).slice(-3000) }
next.stdout.on("data", capture); next.stderr.on("data", capture)
const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#20aa80" } }).png().toBuffer()
const imageWebp = await sharp(image).webp().toBuffer()
const state = { rows: [], loggedIn: false, asset: null, views: 0 }
async function routeHandler(route) {
  const request = route.request(), pathname = new URL(request.url()).pathname, method = request.method()
  const reply = (data, status = 200, headers = {}) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(status >= 400 ? { error: { code: status === 401 ? "UNAUTHORIZED" : "NOT_FOUND", message: "No disponible" } } : { data }) })
  if (pathname === "/api/auth/login") { state.loggedIn = true; return reply({ authenticated: true }, 200, { "set-cookie": `${cookieName}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax` }) }
  if (pathname.startsWith("/api/admin/") && !state.loggedIn) return reply(null, 401)
  if (pathname === "/api/admin/session") return reply({ id: user.id, email: user.email })
  if (pathname === "/api/admin/products") return reply(state.rows.filter(r => !r.deleted))
  if (pathname === "/api/admin/metrics") { const rows = state.rows.filter(r => !r.deleted); return reply({ total: rows.length, available: rows.filter(r => r.is_active && !r.is_sold).length, sold: rows.filter(r => r.is_sold).length, views: rows.reduce((sum, r) => sum + r.views_count, 0) }) }
  if (pathname === "/api/catalog/settings") return reply({ whatsapp_number: "+523312345678" })
  if (pathname === "/api/catalog/products") return reply(state.rows.filter(r => r.is_active && !r.deleted))
  if (pathname.startsWith("/api/catalog/images/")) return route.fulfill({ status: 200, contentType: "image/webp", body: imageWebp })
  if (pathname.startsWith("/api/admin/uploads/")) { const productId = pathname.split("/").at(-1); state.asset = crypto.randomUUID(); return reply({ path: `${productId}/${state.asset}.webp` }, 201) }
  const id = pathname.split("/")[4]
  const row = state.rows.find(item => item.id === id && !item.deleted)
  if (pathname.endsWith("/views")) { if (row?.is_active) { row.views_count++; state.views++ }; return reply({ accepted: true }) }
  if (pathname.startsWith("/api/catalog/products/")) return row?.is_active ? reply(row) : reply(null, 404)
  if (method === "PATCH" && pathname.endsWith("/states")) { Object.assign(row, request.postDataJSON()); return reply(row) }
  if (method === "DELETE") { row.deleted = true; return reply({ deleted: true }) }
  if (method === "POST" || method === "PUT") { const updated = { ...request.postDataJSON(), id, views_count: row?.views_count ?? 0, created_at: "2026-01-01T00:00:00Z" }; state.rows = [updated, ...state.rows.filter(item => item.id !== id)]; return reply(updated, method === "POST" ? 201 : 200) }
  return reply(null, 404)
}
let browser
try {
  let ready = false
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    if (next.exitCode !== null) throw new Error("Test server exited")
    try { if ((await fetch(`${base}/admin/login`, { signal: AbortSignal.timeout(2500) })).ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert.ok(ready, "isolated server ready")
  browser = await chromium.launch({ executablePath: process.env.TEST_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, serviceWorkers: "block" })
  await context.route("**/api/**", routeHandler)
  const admin = await context.newPage()
  await admin.goto(`${base}/admin/login`)
  await admin.getByLabel("Correo electrónico").fill(user.email)
  await admin.getByLabel("Contraseña", { exact: true }).fill("contraseña simulada 123")
  await admin.getByRole("button", { name: "Entrar al panel" }).click()
  await admin.waitForURL(`${base}/admin`)
  await admin.getByRole("button", { name: "Agregar producto" }).click()
  const dialog = admin.getByRole("dialog")
  await dialog.getByLabel("Título / Modelo").fill("PRUEBA INTEGRACIÓN")
  await dialog.getByLabel("Marca", { exact: true }).fill("Prueba")
  await dialog.getByLabel("Precio (MXN)").fill("123.45")
  await dialog.getByLabel("Categoría", { exact: true }).selectOption("Otros")
  await dialog.getByLabel("Elegir fotos del producto").setInputFiles({ name: "prueba.png", mimeType: "image/png", buffer: image })
  await dialog.getByRole("img", { name: "Foto 1 del producto" }).waitFor()
  await dialog.getByRole("button", { name: "Crear producto" }).click()
  await dialog.waitFor({ state: "hidden" })
  const catalog = await context.newPage()
  await catalog.goto(base)
  await catalog.getByText("Todavía no hay productos publicados").waitFor()
  assert.equal(state.rows[0].is_active, false)
  console.log("PASS oculto no aparece en catálogo")
  await admin.getByRole("switch", { name: "Visible: PRUEBA INTEGRACIÓN" }).click()
  await admin.getByText("Estado actualizado.").waitFor()
  await catalog.getByRole("button", { name: "Actualizar catálogo" }).click()
  await catalog.getByRole("button", { name: "PRUEBA INTEGRACIÓN" }).waitFor()
  await catalog.getByRole("button", { name: "PRUEBA INTEGRACIÓN" }).click()
  const detail = catalog.getByRole("dialog")
  await detail.getByRole("heading", { name: "PRUEBA INTEGRACIÓN" }).waitFor()
  const whatsapp = new URL(await detail.getByRole("link", { name: "Contactar por WhatsApp" }).getAttribute("href"))
  assert.match(whatsapp.searchParams.get("text"), /PRUEBA INTEGRACIÓN/)
  assert.match(whatsapp.searchParams.get("text"), /123\.45/)
  assert.equal(state.views, 1)
  await detail.getByRole("button", { name: "Cerrar", exact: true }).click()
  await detail.waitFor({ state: "hidden" })
  await admin.getByRole("button", { name: "Actualizar", exact: true }).click()
  await admin.getByRole("button", { name: "Editar PRUEBA INTEGRACIÓN" }).waitFor()
  await admin.getByRole("button", { name: "Editar PRUEBA INTEGRACIÓN" }).click()
  await dialog.getByLabel("Precio (MXN)").fill("234.56")
  await dialog.getByRole("button", { name: "Guardar cambios" }).click()
  await dialog.waitFor({ state: "hidden" })
  await admin.getByRole("switch", { name: "Agotado: PRUEBA INTEGRACIÓN" }).click()
  await admin.getByText("Estado actualizado.").waitFor()
  await catalog.getByRole("button", { name: "Actualizar catálogo" }).click()
  await catalog.getByText("$234.56 MXN").waitFor()
  await catalog.getByText("Agotado", { exact: true }).waitFor()
  console.log("PASS publicar, ver, contar, editar y agotar")
  await admin.getByRole("switch", { name: "Visible: PRUEBA INTEGRACIÓN" }).click()
  await admin.getByText("Estado actualizado.").waitFor()
  await catalog.getByRole("button", { name: "Actualizar catálogo" }).click()
  await catalog.getByText("Todavía no hay productos publicados").waitFor()
  await admin.getByRole("button", { name: "Eliminar PRUEBA INTEGRACIÓN" }).click()
  await admin.getByRole("alertdialog").getByRole("button", { name: "Eliminar producto" }).click()
  await admin.getByText("Producto retirado del inventario.").waitFor()
  assert.equal(state.rows[0].deleted, true)
  assert.ok(state.asset)
  console.log("PASS ocultar y eliminación lógica, archivo retenido (simulado)")
  console.log(JSON.stringify({ integrationPassed: true, realSupabaseWrites: 0, whatsappNavigations: 0 }))
} catch (error) { console.error(error.message); console.error(output); process.exitCode = 1 }
finally {
  await browser?.close()
  if (process.platform === "win32" && next.pid) await new Promise(resolve => execFile("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true }, resolve))
  else next.kill("SIGTERM")
  await new Promise(resolve => auth.close(resolve))
}
