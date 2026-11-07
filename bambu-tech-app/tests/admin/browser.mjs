// Local UI integration only: fake Supabase, intercepted app API, synthetic identities and inventory.
// Never loads .env.local into this test process or contacts the user's Supabase project.
import assert from "node:assert/strict"
import http from "node:http"
import net from "node:net"
import { mkdir } from "node:fs/promises"
import { spawn, execFile } from "node:child_process"
import { chromium } from "playwright"

const base = "http://127.0.0.1:3110"
const executablePath = process.env.TEST_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
await mkdir(".test-artifacts/admin", { recursive: true })
const user = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "administrador@example.test", aud: "authenticated", role: "authenticated", created_at: "2026-01-01T00:00:00Z", app_metadata: { provider: "email" }, user_metadata: {} }
const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.local-test-signature`
const sessionCookie = `base64-${Buffer.from(JSON.stringify({ access_token: jwt, refresh_token: "local-test-refresh", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user })).toString("base64url")}`
const cookieName = "sb-127-auth-token"
let adminRole = true
const authMock = http.createServer((request, response) => {
  response.setHeader("Content-Type", "application/json")
  if (request.url === "/auth/v1/user") { response.end(JSON.stringify(user)); return }
  if (request.url === "/rest/v1/rpc/admin_session") { response.end(JSON.stringify(adminRole)); return }
  response.statusCode = 404
  response.end(JSON.stringify({ message: "Local mock route not defined" }))
})
await new Promise(resolve => authMock.listen(0, "127.0.0.1", resolve))
const mockPort = authMock.address().port
const portProbe = net.createServer()
await new Promise((resolve, reject) => portProbe.once("error", reject).listen(3110, "127.0.0.1", resolve))
await new Promise(resolve => portProbe.close(resolve))
let output = ""
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3110"], {
  env: { ...process.env, NODE_ENV: "development", BAMBU_ADMIN_TEST: "1", APP_ORIGIN: base, SUPABASE_URL: `http://127.0.0.1:${mockPort}`, SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_testing_only", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_local_testing_only" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
})
const capture = bytes => { output = (output + bytes.toString().replace(/([?&](?:code|password)=)[^\s&]+/g, "$1[redacted]")).slice(-5000) }
next.stdout.on("data", capture)
next.stderr.on("data", capture)
let browser
let assertions = 0
const pass = name => { assertions++; console.log(`PASS ${name}`) }
const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=", "base64")
const store = { rows: [], number: "+523312345678", authenticated: false, uploads: 0, loginCalls: 0, postIds: [], putIds: [], failNextSave: false, expireNextSave: false, conflictNextCreate: false, failNextUpload: false, recoveryCalls: 0, passwordCalls: 0, holdPassword: false }
async function intercepted(route) {
  const request = route.request()
  const path = new URL(request.url()).pathname
  const method = request.method()
  const data = request.postDataJSON.bind(request)
  const reply = (value, status = 200, headers = {}) => route.fulfill({ status, contentType: "application/json", headers, body: JSON.stringify(status >= 400 ? { error: { code: status === 401 ? "UNAUTHORIZED" : status === 409 ? "CONFLICT" : "UNAVAILABLE", message: status === 401 ? "Inicia sesión para continuar." : status === 409 ? "El registro ya existe." : "Fallo de prueba. Inténtalo de nuevo." } } : { data: value }) })
  if (path === "/api/auth/login") {
    store.loginCalls++
    await new Promise(resolve => setTimeout(resolve, 150))
    store.authenticated = true
    return reply({ authenticated: true }, 200, { "set-cookie": `${cookieName}=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax` })
  }
  if (path === "/api/auth/recovery") { store.recoveryCalls++; return reply({ message: "Si la cuenta existe y puede recuperar acceso, recibirá instrucciones por correo." }) }
  if (path === "/api/auth/logout") { store.authenticated = false; return reply({ authenticated: false }, 200, { "set-cookie": `${cookieName}=; Path=/; Max-Age=0` }) }
  if (path.startsWith("/api/admin/") || path === "/api/auth/password") { if (!store.authenticated) return reply(null, 401) }
  if (path === "/api/admin/session") return reply({ id: user.id, email: user.email })
  if (path === "/api/auth/password") {
    store.passwordCalls++
    while (store.holdPassword) await new Promise(resolve => setTimeout(resolve, 30))
    return reply({ updated: true })
  }
  if (path === "/api/catalog/settings") return reply({ whatsapp_number: store.number })
  if (path === "/api/admin/settings") { store.number = data().whatsapp_number; return reply({ whatsapp_number: store.number }) }
  if (path === "/api/admin/products") return reply(store.rows)
  if (path === "/api/admin/metrics") return reply({ total: store.rows.length, available: store.rows.filter(row => row.is_active && !row.is_sold).length, sold: store.rows.filter(row => row.is_sold).length, views: store.rows.reduce((sum, row) => sum + row.views_count, 0) })
  if (path.startsWith("/api/catalog/images/")) return route.fulfill({ status: 200, contentType: "image/png", body: image })
  if (path.startsWith("/api/admin/uploads/")) {
    if (store.failNextUpload) { store.failNextUpload = false; return reply(null, 503) }
    store.uploads++
    const asset = crypto.randomUUID()
    return reply({ id: asset, path: `${path.split("/").at(-1)}/${asset}.webp`, url: `/api/catalog/images/${asset}` }, 201)
  }
  const id = path.split("/")[4]
  if (method === "PATCH" && path.endsWith("/states")) { const row = store.rows.find(item => item.id === id); Object.assign(row, data()); return reply(row) }
  if (method === "DELETE") { store.rows = store.rows.filter(row => row.id !== id); return reply({ deleted: true }) }
  if (method === "POST" || method === "PUT") {
    if (method === "POST") store.postIds.push(id); else store.putIds.push(id)
    if (store.expireNextSave) { store.expireNextSave = false; store.authenticated = false; return reply(null, 401) }
    if (store.failNextSave) { store.failNextSave = false; return reply(null, 503) }
    const row = { ...data(), id, views_count: 3, created_at: "2026-01-01T00:00:00Z" }
    store.rows = [row, ...store.rows.filter(item => item.id !== id)]
    if (method === "POST" && store.conflictNextCreate) { store.conflictNextCreate = false; return reply(null, 409) }
    return reply(row, method === "POST" ? 201 : 200)
  }
  return reply(null, 404)
}
try {
  let ready = false
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    if (next.exitCode !== null) throw new Error("Test server exited")
    try { const response = await fetch(`${base}/admin/login`, { signal: AbortSignal.timeout(2500) }); if (response.status === 200) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert.ok(ready, "local test server ready")
  let response = await fetch(`${base}/admin`, { redirect: "manual" })
  assert.equal(response.status, 303)
  assert.equal(new URL(response.headers.get("location"), base).pathname, "/admin/login")
  response = await fetch(`${base}/admin/login/extra`, { redirect: "manual" })
  assert.equal(response.status, 303)
  assert.equal((await fetch(`${base}/admin/recovery`)).status, 200)
  pass("proxy: anonymous redirect and exact public route exceptions")
  browser = await chromium.launch({ executablePath, headless: true })
  const noJs = await browser.newContext({ javaScriptEnabled: false })
  const noJsPage = await noJs.newPage()
  await noJsPage.goto(`${base}/admin/login`)
  assert.equal(await noJsPage.locator("form").getAttribute("method"), "post")
  assert.equal(await noJsPage.locator("form").getAttribute("action"), "/api/auth/login")
  assert.equal(await noJsPage.getByLabel("Contraseña", { exact: true }).isDisabled(), true)
  assert.equal(await noJsPage.getByRole("button", { name: "Entrar al panel" }).isDisabled(), true)
  await noJs.addCookies([{ name: cookieName, value: sessionCookie, url: base, httpOnly: true, sameSite: "Lax" }])
  await noJsPage.goto(`${base}/admin`)
  const serverRefresh = noJsPage.getByRole("button", { name: "Actualizando…", exact: true })
  assert.equal(await serverRefresh.isDisabled(), true)
  assert.equal(await serverRefresh.getAttribute("autocomplete"), "off")
  await noJsPage.reload()
  assert.equal(await serverRefresh.isDisabled(), true)
  assert.equal(await serverRefresh.getAttribute("autocomplete"), "off")
  await noJs.close()
  pass("pre-hydration: password form uses POST and cannot submit before JavaScript is ready")
  pass("panel SSR: refresh remains initially disabled and opts out of restored state without JavaScript")
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: "block" })
  const credentialQueryPaths = []
  context.on("request", request => {
    const url = new URL(request.url())
    if (["email", "password", "new-password", "confirm-password"].some(key => url.searchParams.has(key))) credentialQueryPaths.push(url.pathname)
  })
  await context.route("**/api/**", intercepted)
  const page = await context.newPage()
  const pageErrors = []
  const hydrationMessages = []
  page.on("pageerror", error => pageErrors.push(error.message))
  page.on("console", message => {
    if (["error", "warning"].includes(message.type()) && /hydrat|didn.t match|server rendered html|server-rendered html/i.test(message.text())) hydrationMessages.push(message.text())
  })
  await page.goto(`${base}/admin/login`)
  await page.getByLabel("Correo electrónico").waitFor({ state: "visible" })
  await page.waitForFunction(() => !document.getElementById("email").disabled)
  await page.screenshot({ path: ".test-artifacts/admin/login-desktop.png", fullPage: true, animations: "disabled" })
  await page.getByLabel("Correo electrónico").fill(user.email)
  await page.getByLabel("Contraseña", { exact: true }).fill("Contraseña de prueba 123!")
  await page.getByRole("button", { name: "Entrar al panel" }).dblclick()
  await page.waitForURL(`${base}/admin`)
  await page.getByText("No hay productos en el inventario", { exact: true }).waitFor()
  assert.equal(store.loginCalls, 1)
  pass("login: duplicate action prevented and empty persistent inventory")
  for (let reload = 0; reload < 3; reload++) {
    await page.reload()
    await page.getByText("No hay productos en el inventario", { exact: true }).waitFor()
    const refresh = page.getByRole("button", { name: "Actualizar", exact: true })
    assert.equal(await refresh.isDisabled(), false)
    assert.equal(await refresh.getAttribute("autocomplete"), "off")
  }
  assert.equal(hydrationMessages.length, 0)
  pass("panel hydration: three clean Chrome reloads without hydration warnings")

  await page.getByRole("button", { name: "Agregar producto" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Título / Modelo").fill("Bocina de prueba")
  await dialog.getByLabel("Marca", { exact: true }).fill("Marca libre")
  await dialog.getByLabel("Precio (MXN)").fill("123.45")
  await dialog.getByLabel("Categoría", { exact: true }).selectOption("Bocinas")
  await dialog.getByLabel("Potencia (W)").fill("20.5")
  assert.equal(await dialog.getByLabel("RAM (GB)").count(), 0)
  await dialog.getByLabel("Descripción").fill("Descripción de prueba")
  const fileInput = dialog.getByLabel("Elegir fotos del producto")
  await fileInput.setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(4194305) })
  await dialog.getByRole("alert").filter({ hasText: "hasta 4 MiB" }).waitFor()
  assert.equal(store.uploads, 0)
  store.failNextUpload = true
  await fileInput.setInputFiles({ name: "portada.png", mimeType: "image/png", buffer: image })
  await dialog.getByRole("button", { name: "Reintentar 1 foto pendiente" }).waitFor()
  await dialog.getByRole("button", { name: "Reintentar 1 foto pendiente" }).click()
  await dialog.getByRole("img", { name: "Foto 1 del producto" }).waitFor()
  assert.equal(store.uploads, 1)
  await page.screenshot({ path: ".test-artifacts/admin/product-form-desktop.png", fullPage: true, animations: "disabled" })
  pass("form: category-specific specs, 4 MiB rejection and upload retry")
  store.failNextSave = true
  await dialog.getByRole("button", { name: "Crear producto" }).click()
  await dialog.getByRole("alert").filter({ hasText: "Fallo de prueba" }).waitFor()
  assert.equal(await dialog.getByLabel("Título / Modelo").inputValue(), "Bocina de prueba")
  assert.equal(await dialog.getByLabel("Potencia (W)").inputValue(), "20.5")
  await dialog.getByRole("button", { name: "Crear producto" }).click()
  await dialog.waitFor({ state: "hidden" })
  await page.getByText("Producto guardado.", { exact: true }).waitFor()
  assert.equal(store.postIds.length, 2)
  assert.equal(store.postIds[0], store.postIds[1])
  assert.equal(store.rows.length, 1)
  assert.equal(store.rows[0].specs.power_w, 20.5)
  await page.reload()
  await page.getByRole("button", { name: "Editar Bocina de prueba" }).waitFor()
  pass("save failure retains draft and image, reserved UUID survives retry and reload")

  await page.getByRole("switch", { name: "Visible: Bocina de prueba", exact: true }).click()
  await page.getByText("Estado actualizado.", { exact: true }).waitFor()
  await page.getByRole("switch", { name: "Agotado: Bocina de prueba", exact: true }).click()
  await page.getByText("Estado actualizado.", { exact: true }).waitFor()
  assert.equal(store.rows[0].is_active, true)
  assert.equal(store.rows[0].is_sold, true)
  await page.getByLabel("Número de WhatsApp").fill("+52 (33) 1234-5678")
  await page.getByRole("button", { name: "Guardar WhatsApp" }).click()
  await page.getByText("WhatsApp guardado.", { exact: true }).waitFor()
  assert.equal(store.number, "+523312345678")
  pass("independent visibility/sold switches and normalized persistent settings")

  await page.getByRole("button", { name: "Editar Bocina de prueba" }).click()
  await dialog.getByLabel("Título / Modelo").fill("Borrador conservado")
  store.expireNextSave = true
  await dialog.getByRole("button", { name: "Guardar cambios" }).click()
  const reauth = dialog.getByRole("link", { name: /Iniciar sesión en otra pestaña/ })
  await reauth.waitFor()
  const popupPromise = context.waitForEvent("page")
  await reauth.click()
  const popup = await popupPromise
  await popup.getByLabel("Correo electrónico").fill(user.email)
  await popup.getByLabel("Contraseña", { exact: true }).fill("Contraseña de prueba 123!")
  await popup.getByRole("button", { name: "Entrar al panel" }).click()
  await popup.waitForURL(`${base}/admin`)
  await popup.close()
  await page.bringToFront()
  assert.equal(await dialog.getByLabel("Título / Modelo").inputValue(), "Borrador conservado")
  await dialog.getByRole("button", { name: "Guardar cambios" }).click()
  await dialog.waitFor({ state: "hidden" })
  await page.getByRole("button", { name: "Editar Borrador conservado" }).waitFor()
  pass("expired session: reauthenticate inside dialog without losing draft")

  await page.getByRole("button", { name: "Agregar producto" }).click()
  await dialog.getByLabel("Título / Modelo").fill("Creación reconciliada")
  await dialog.getByLabel("Marca", { exact: true }).fill("Marca")
  await dialog.getByLabel("Precio (MXN)").fill("50")
  await dialog.getByLabel("Elegir fotos del producto").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: image })
  await dialog.getByRole("img", { name: "Foto 1 del producto" }).waitFor()
  store.conflictNextCreate = true
  await dialog.getByRole("button", { name: "Crear producto" }).click()
  await dialog.getByRole("alert").filter({ hasText: "ya existe en el servidor" }).waitFor()
  await dialog.getByLabel("Título / Modelo").fill("Creación reconciliada editada")
  await dialog.getByRole("button", { name: "Crear producto" }).click()
  await dialog.waitFor({ state: "hidden" })
  assert.equal(store.rows.length, 2)
  assert.ok(store.putIds.includes(store.postIds.at(-1)))
  pass("ambiguous creation/409 reconciles as update with same UUID and intact draft")

  await page.getByRole("button", { name: "Eliminar Creación reconciliada editada" }).click()
  const confirmation = page.getByRole("alertdialog")
  await confirmation.getByRole("button", { name: "Cancelar", exact: true }).click()
  assert.equal(store.rows.length, 2)
  await page.getByRole("button", { name: "Eliminar Creación reconciliada editada" }).click()
  await confirmation.getByRole("button", { name: "Eliminar producto", exact: true }).click()
  await confirmation.waitFor({ state: "hidden" })
  assert.equal(store.rows.length, 1)
  pass("deletion requires confirmation and refreshes inventory")

  await page.goto(`${base}/admin?recovery=1`)
  await page.getByRole("heading", { name: "Establecer contraseña" }).waitFor()
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("Contraseña nueva 123!")
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Otra contraseña 123!")
  await page.getByRole("button", { name: "Guardar contraseña", exact: true }).click()
  await page.getByText("Las contraseñas no coinciden.", { exact: true }).waitFor()
  assert.equal(store.passwordCalls, 0)
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Contraseña nueva 123!")
  store.holdPassword = true
  await page.getByRole("button", { name: "Guardar contraseña", exact: true }).click()
  await page.getByRole("button", { name: "Guardando…", exact: true }).waitFor()
  assert.equal(await page.getByRole("button", { name: "Cerrar sesión", exact: true }).isDisabled(), true)
  store.holdPassword = false
  await page.getByText("Contraseña actualizada.", { exact: true }).waitFor()
  assert.equal(store.passwordCalls, 1)
  await page.screenshot({ path: ".test-artifacts/admin/dashboard-desktop.png", fullPage: true, animations: "disabled" })
  pass("recovery password UI validates confirmation and blocks concurrent actions (mock only)")

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Agregar producto" }).click()
  await dialog.waitFor()
  assert.ok(await dialog.evaluate(element => element.getBoundingClientRect().width <= 390))
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  await page.screenshot({ path: ".test-artifacts/admin/product-form-mobile.png", fullPage: true, animations: "disabled" })
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click()
  await dialog.waitFor({ state: "hidden" })
  await page.screenshot({ path: ".test-artifacts/admin/dashboard-mobile.png", fullPage: true, animations: "disabled" })
  pass("mobile: dialog fits viewport and only inventory table scrolls internally")

  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click()
  await page.waitForURL(`${base}/admin/login`)
  await page.getByRole("link", { name: "Olvidé mi contraseña" }).click()
  await page.waitForURL(`${base}/admin/recovery`)
  await page.getByLabel("Correo electrónico").fill("inexistente@example.test")
  await page.getByRole("button", { name: "Enviar instrucciones" }).click()
  await page.getByRole("status").filter({ hasText: "Si la cuenta existe" }).waitFor()
  assert.equal(store.recoveryCalls, 1)
  pass("logout and generic recovery request (mock only, no email sent)")
  await context.addCookies([{ name: cookieName, value: sessionCookie, url: base, httpOnly: true, sameSite: "Lax" }])
  adminRole = false
  response = await context.request.get(`${base}/admin`, { maxRedirects: 0 })
  assert.equal(response.status(), 403)
  adminRole = true
  assert.deepEqual(pageErrors, [])
  assert.deepEqual(hydrationMessages, [])
  assert.deepEqual(credentialQueryPaths, [])
  pass("proxy: authenticated non-admin denied; no browser runtime errors")
  console.log(JSON.stringify({ browserChecks: assertions, realSupabaseRequests: 0, realEmailsSent: 0, realPasswordsChanged: 0 }))
} catch (error) {
  console.error(String(error.message).replace(/sb-(?:127)-auth-token=[^\s;]+/g, "[redacted]"))
  console.error(output)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (process.platform === "win32" && next.pid && next.exitCode === null) await new Promise(resolve => execFile("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true }, resolve))
  else next.kill("SIGTERM")
  await new Promise(resolve => authMock.close(resolve))
}
