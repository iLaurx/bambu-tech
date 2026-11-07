// Isolated demonstration check. No real credentials or Supabase requests.
import assert from "node:assert/strict"
import net from "node:net"
import { spawn, execFile } from "node:child_process"
import { chromium } from "playwright"

const port = 3115, base = `http://127.0.0.1:${port}`
const probe = net.createServer()
await new Promise((resolve, reject) => probe.once("error", reject).listen(port, "127.0.0.1", resolve))
await new Promise(resolve => probe.close(resolve))
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, NODE_ENV: "development", BAMBU_ADMIN_TEST: "1", BAMBU_DEMO: "1", APP_ORIGIN: base, SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_fake" },
  stdio: "ignore", windowsHide: true,
})
let browser
try {
  let ready = false
  for (let i = 0; i < 160; i++) {
    if (next.exitCode !== null) break
    try { if ((await fetch(base, { signal: AbortSignal.timeout(2000) })).status === 200) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  assert.ok(ready, "demo server ready")
  const products = await (await fetch(`${base}/api/catalog/products`)).json()
  assert.equal(products.data.length, 3)
  for (const product of products.data) {
    const asset = product.main_image.split("/")[1].slice(0, -5)
    const image = await fetch(`${base}/api/catalog/images/${asset}`)
    assert.equal(image.status, 200)
    assert.equal(image.headers.get("content-type"), "image/png")
    assert.ok((await image.arrayBuffer()).byteLength > 0)
  }
  assert.equal((await (await fetch(`${base}/api/catalog/settings`)).json()).data.whatsapp_number, null)
  for (const path of ["/admin", "/admin/login", "/api/admin/session"]) assert.equal((await fetch(`${base}${path}`, { redirect: "manual" })).status, 403)
  assert.equal((await fetch(`${base}/api/auth/login`, { method: "POST", headers: { origin: base, "content-type": "application/json" }, body: "{}" })).status, 403)
  browser = await chromium.launch({ headless: true, executablePath: process.env.TEST_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" })
  const page = await browser.newPage()
  await page.goto(base)
  await page.getByText(/Demostración: productos y precios de ejemplo/).waitFor()
  await page.getByText("3 productos", { exact: true }).waitFor()
  await page.getByRole("button", { name: /iPhone 14/ }).first().click()
  await page.getByRole("dialog").getByText(/Producto y precio de demostración/).waitFor()
  assert.equal(await page.getByRole("dialog").locator('a[href^="https://wa.me/"]').count(), 0)
  console.log("PASS demo catalog, images, blocked admin and contact; no real Supabase")
} finally {
  if (browser) await browser.close()
  if (process.platform === "win32") await new Promise(resolve => execFile("taskkill", ["/pid", String(next.pid), "/T", "/F"], () => resolve()))
  else next.kill("SIGTERM")
}
