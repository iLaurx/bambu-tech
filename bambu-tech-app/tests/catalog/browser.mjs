// Local catalogue UI integration: API responses and inventory are synthetic. Never load credentials.
import assert from "node:assert/strict"
import net from "node:net"
import fs from "node:fs/promises"
import { spawn, execFile } from "node:child_process"
import { chromium } from "playwright"
import sharp from "sharp"
const base = "http://127.0.0.1:3111"
const artifacts = ".test-artifacts/catalog"
await fs.mkdir(artifacts, { recursive: true })
const probe = net.createServer()
await new Promise((resolve, reject) => probe.once("error", reject).listen(3111, "127.0.0.1", resolve))
await new Promise(resolve => probe.close(resolve))
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3111"], {
 env: { ...process.env, NODE_ENV: "development", BAMBU_ADMIN_TEST: "1", APP_ORIGIN: base, SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_testing_only", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_local_testing_only" },
 stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
})
let output = ""
const capture = bytes => { output = (output + bytes.toString()).slice(-4000) }
next.stdout.on("data", capture); next.stderr.on("data", capture)
const id = index => `${String(index).padStart(8, "0")}-1111-4111-8111-111111111111`
const asset = index => `${String(index).padStart(8, "0")}-2222-4222-8222-222222222222`
const path = (index, image = 1) => `${id(index)}/${asset(image)}.webp`
const row = (index, title, category, price, specs = {}) => ({ id: id(index), title, category, price, specs, brand: index === 1 ? "Todos" : "Marca libre", condition: "Nuevo", description: `Descripción de ${title}`, main_image: path(index), gallery_images: [2, 3, 4, 5].map(image => path(index, image)), is_active: true, is_sold: index === 2, views_count: 0, created_at: "2026-01-01T00:00:00Z" })
const rows = [row(1, "Teléfono Alfa", "Celulares", 5000, { processor: "Chip", ram_gb: 8, unlocked: false }), row(2, "Bocina Beta", "Bocinas", 10000, { power_w: 30, connectivity: "Bluetooth" }), row(3, "Banda Gamma", "Smartbands", 2500, { battery_days: 7 }), row(4, "Reloj Delta", "Smartwatches", 20000, { compatibility: "Android" }), row(5, "Accesorio Épsilon", "Otros", 19.99), { ...row(6, "Producto oculto", "Otros", 1), is_active: false, brand: "Oculta" }]
const state = { rows, failProducts: true, failSettings: true, number: "+523312345678", failViews: true, views: new Map(), gone: new Set(), detailDelay: 0 }
const image = await sharp({ create: { width: 400, height: 400, channels: 3, background: "#d7e8df" } }).webp().toBuffer()
let browser
let checks = 0
const pass = label => { checks++; console.log(`PASS ${label}`) }
try {
 let ready = false
 const deadline = Date.now() + 180000
 while (Date.now() < deadline) {
  if (next.exitCode !== null) throw new Error("Local test server exited")
  try { if ((await fetch(base, { signal: AbortSignal.timeout(2500) })).status === 200) { ready = true; break } } catch {}
  await new Promise(resolve => setTimeout(resolve, 250))
 }
 assert.ok(ready)
 browser = await chromium.launch({ executablePath: process.env.TEST_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true })
 const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: "block" })
 await context.route("**/api/**", async route => {
  const request = route.request(); const pathname = new URL(request.url()).pathname
  const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(status >= 400 ? { error: { code: "UNAVAILABLE", message: "private diagnostic" } } : { data }) })
  if (pathname === "/api/catalog/products") { if (state.failProducts) { return reply(null, 503) }; return reply(state.rows.filter(row => !state.gone.has(row.id))) }
  if (pathname === "/api/catalog/settings") return state.failSettings ? reply(null, 503) : reply({ whatsapp_number: state.number })
  if (pathname.startsWith("/api/catalog/images/")) return route.fulfill({ status: 200, contentType: "image/webp", body: image })
  const productId = pathname.split("/")[4]
  if (pathname.endsWith("/views")) { state.views.set(productId, (state.views.get(productId) ?? 0) + 1); return reply({ accepted: true }, state.failViews ? 503 : 200) }
  if (state.detailDelay) await new Promise(resolve => setTimeout(resolve, state.detailDelay))
  const product = state.rows.find(row => row.id === productId)
  return product && !state.gone.has(productId) ? reply(product) : reply(null, 404)
 })
 const page = await context.newPage()
 const errors = []; page.on("pageerror", error => errors.push(error.message))
 const hydrationErrors = []
 page.on("console", message => { if (["error", "warning"].includes(message.type()) && /hydrat|didn.t match|server rendered html|server-rendered html/i.test(message.text())) hydrationErrors.push(message.text()) })
 await page.goto(base)
 await page.getByRole("alert").filter({ hasText: "No pudimos cargar" }).waitFor()
 assert.equal(await page.getByRole("button", { name: "Teléfono Alfa", exact: true }).count(), 0)
 state.failProducts = false
 await page.getByRole("button", { name: "Reintentar catálogo" }).click()
 await page.getByRole("button", { name: "Teléfono Alfa", exact: true }).waitFor()
 assert.equal(await page.getByRole("button", { name: "Producto oculto", exact: true }).count(), 0)
 assert.equal(await page.getByRole("option", { name: "Oculta", exact: true }).count(), 0)
 await page.screenshot({ path: `${artifacts}/catalog-desktop.png`, fullPage: true, animations: "disabled" })
 pass("load failure retry; active sold stays visible and hidden products/brands excluded")
 await page.getByRole("button", { name: "Bocinas", exact: true }).click()
 await page.getByLabel("Marca", { exact: true }).selectOption("Marca libre")
 await page.getByLabel("Rango de precio").selectOption("2")
 await page.getByRole("searchbox").fill(" beta ")
 assert.equal(await page.getByRole("button", { name: "Bocina Beta", exact: true }).count(), 1)
 assert.equal(await page.getByRole("button", { name: "Teléfono Alfa", exact: true }).count(), 0)
 await page.getByRole("searchbox").fill("sin coincidencias")
 await page.getByText("No encontramos productos con esos filtros", { exact: true }).waitFor()
 await page.getByRole("button", { name: "Limpiar filtros" }).click()
 pass("dynamic combined search/category/brand/price and no-result reset")
 await page.getByLabel("Marca", { exact: true }).selectOption("Todos")
 assert.equal(await page.getByRole("button", { name: "Teléfono Alfa", exact: true }).count(), 1)
 assert.equal(await page.getByRole("button", { name: "Bocina Beta", exact: true }).count(), 0)
 await page.getByLabel("Marca", { exact: true }).selectOption("")
 await page.getByRole("button", { name: "Teléfono Alfa", exact: true }).dblclick()
 const dialog = page.getByRole("dialog")
 await dialog.getByRole("heading", { name: "Teléfono Alfa", exact: true }).waitFor()
 await dialog.getByText("No", { exact: true }).waitFor()
 await dialog.getByText("Actualizar contacto", { exact: true }).waitFor()
 assert.equal(await dialog.getByRole("link", { name: "Contactar por WhatsApp" }).count(), 0)
 assert.equal(state.views.get(id(1)), 1)
 await dialog.getByRole("button", { name: "Foto siguiente" }).click()
 await dialog.getByRole("img", { name: /foto 2 de 4/ }).waitFor()
 assert.equal(await dialog.getByRole("button", { name: /Ver foto/ }).count(), 4)
 assert.equal(state.views.get(id(1)), 1)
 state.failSettings = false
 await dialog.getByRole("button", { name: "Actualizar contacto", exact: true }).click()
 const contact = dialog.getByRole("link", { name: "Contactar por WhatsApp" })
 await contact.waitFor()
 assert.equal(await contact.getAttribute("target"), "_blank")
 assert.match(await contact.getAttribute("rel"), /noopener/)
 let url = new URL(await contact.getAttribute("href"))
 assert.match(url.searchParams.get("text"), /Teléfono Alfa/)
 assert.equal(url.pathname, "/523312345678")
 await page.screenshot({ path: `${artifacts}/detail-desktop.png`, fullPage: true, animations: "disabled" })
 pass("brand named Todos, latest detail, false spec, four-image gallery and contact retry; failed view is nonblocking and not retried")
 state.rows[0] = { ...state.rows[0], price: 123.45, title: "Teléfono actualizado" }
 state.number = "+523398765432"
 await page.evaluate(() => window.dispatchEvent(new Event("focus")))
 await dialog.getByRole("heading", { name: "Teléfono actualizado", exact: true }).waitFor()
 await contact.waitFor()
 url = new URL(await contact.getAttribute("href"))
 assert.match(url.searchParams.get("text"), /123\.45/); assert.equal(url.pathname, "/523398765432")
 assert.equal(state.views.get(id(1)), 1)
 pass("focus refresh updates price/title/contact without recount")
 state.gone.add(id(1))
 await page.evaluate(() => window.dispatchEvent(new Event("focus")))
 await dialog.getByText("Este producto ya no está disponible en el catálogo.", { exact: true }).waitFor()
 assert.equal(await dialog.getByRole("link", { name: "Contactar por WhatsApp" }).count(), 0)
 await dialog.getByRole("button", { name: "Reintentar detalle" }).click()
 await dialog.getByText("Este producto ya no está disponible en el catálogo.", { exact: true }).waitFor()
 await dialog.getByRole("button", { name: "Cerrar", exact: true }).click()
 await dialog.waitFor({ state: "hidden" })
 pass("hidden while open removes contact/card and retry actually revalidates")
 await page.getByRole("button", { name: "Bocina Beta", exact: true }).click()
 await dialog.getByRole("heading", { name: "Bocina Beta", exact: true }).waitFor()
 assert.equal(await dialog.getByText("Memoria RAM", { exact: true }).count(), 0)
 await dialog.getByText("30 W", { exact: true }).waitFor()
 await dialog.getByRole("link", { name: "Contactar por WhatsApp" }).waitFor()
 assert.equal(state.views.get(id(2)), 1)
 await dialog.getByRole("button", { name: "Cerrar", exact: true }).click()
 await dialog.waitFor({ state: "hidden" })
 await page.getByRole("button", { name: "Bocina Beta", exact: true }).click()
 await dialog.getByRole("heading", { name: "Bocina Beta", exact: true }).waitFor()
 assert.equal(state.views.get(id(2)), 2)
 await dialog.getByRole("button", { name: "Cerrar", exact: true }).click()
 await dialog.waitFor({ state: "hidden" })
 pass("sold contact allowed, category-specific detail and one new view on reopening")
 state.detailDelay = 800
 const lateResponse = page.waitForResponse(response => new URL(response.url()).pathname === `/api/catalog/products/${id(5)}`)
 await page.getByRole("button", { name: "Accesorio Épsilon", exact: true }).click()
 await dialog.getByRole("heading", { name: "Detalle del producto", exact: true }).waitFor()
 await dialog.getByRole("button", { name: "Cerrar", exact: true }).click()
 await dialog.waitFor({ state: "hidden" })
 state.detailDelay = 0
 await page.getByRole("button", { name: "Banda Gamma", exact: true }).click()
 await dialog.getByRole("heading", { name: "Banda Gamma", exact: true }).waitFor()
 await lateResponse
 assert.equal(await dialog.getByRole("heading", { name: "Banda Gamma", exact: true }).count(), 1)
 assert.equal(state.views.get(id(5)), undefined)
 await dialog.getByRole("button", { name: "Cerrar", exact: true }).click()
 await dialog.waitFor({ state: "hidden" })
 pass("late detail response after closing cannot replace another opening or count a cancelled visit")
 state.rows[1].brand = "M".repeat(80)
 await page.evaluate(() => window.dispatchEvent(new Event("focus")))
 await page.getByRole("button", { name: "Bocina Beta", exact: true }).waitFor()
 await page.setViewportSize({ width: 390, height: 844 })
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
 await page.screenshot({ path: `${artifacts}/catalog-mobile.png`, fullPage: true, animations: "disabled" })
 await page.getByRole("button", { name: "Bocina Beta", exact: true }).click()
 await dialog.getByRole("heading", { name: "Bocina Beta", exact: true }).waitFor()
 assert.ok(await dialog.evaluate(element => element.getBoundingClientRect().width <= 390 && element.scrollWidth <= element.clientWidth))
 await page.screenshot({ path: `${artifacts}/detail-mobile.png`, fullPage: false, animations: "disabled" })
 await dialog.getByRole("button", { name: "Cerrar", exact: true }).click()
 await dialog.waitFor({ state: "hidden" })
 pass("mobile catalogue/detail fit viewport with eighty-character brand")
 state.rows = []
 await page.evaluate(() => window.dispatchEvent(new Event("focus")))
 await page.getByText("Todavía no hay productos publicados", { exact: true }).waitFor()
 assert.deepEqual(errors, [])
 assert.deepEqual(hydrationErrors, [], "no React hydration warnings or errors")
 pass("empty inventory distinct from filters/error and no browser runtime errors")
 console.log(JSON.stringify({ browserChecks: checks, realSupabaseRequests: 0, realWhatsAppNavigations: 0, realMutations: 0 }))
} catch (error) { console.error(error.message); console.error(output); process.exitCode = 1 }
finally { await browser?.close(); if (process.platform === "win32" && next.pid) await new Promise(resolve => execFile("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true }, resolve)); else next.kill("SIGTERM") }
