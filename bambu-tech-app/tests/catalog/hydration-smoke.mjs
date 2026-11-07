// Read-only smoke against an already running local server. No credentials, detail openings or writes.
import assert from "node:assert/strict"
import { chromium } from "playwright"
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000"
const url = new URL(base)
assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "local target only")
const browser = await chromium.launch({ executablePath: process.env.TEST_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true })
const hydrationMessages = []
const pageErrors = []
let blockedWrites = 0
try {
 const serverContext = await browser.newContext({ javaScriptEnabled: false })
 const serverPage = await serverContext.newPage()
 await serverPage.goto(base)
 assert.equal(await serverPage.getByRole("button", { name: "Actualizando…", exact: true }).isDisabled(), true)
 assert.equal(await serverPage.getByRole("button", { name: "Actualizando…", exact: true }).getAttribute("autocomplete"), "off")
 console.log(JSON.stringify({ serverInitialLoading: true, serverInitialDisabled: true, restorationOptOutAttribute: "off" }))
 await serverContext.close()
 const context = await browser.newContext({ serviceWorkers: "block" })
 await context.route("**/api/**", route => {
  if (["GET", "HEAD"].includes(route.request().method())) return route.continue()
  blockedWrites++; return route.abort()
 })
 const page = await context.newPage()
 page.on("pageerror", error => pageErrors.push(error.message))
 page.on("console", message => {
  if (["error", "warning"].includes(message.type()) && /hydrat|didn.t match|server rendered html|server-rendered html/i.test(message.text())) hydrationMessages.push(message.text())
 })
 for (let attempt = 0; attempt < 3; attempt++) {
  if (!attempt) await page.goto(base); else await page.reload()
  await page.getByRole("button", { name: "Actualizar catálogo", exact: true }).waitFor()
  assert.equal(await page.getByRole("button", { name: "Actualizar catálogo", exact: true }).isDisabled(), false)
 }
 console.log(JSON.stringify({ cleanReloads: 3, hydrationWarnings: hydrationMessages.length, pageErrors: pageErrors.length, blockedWrites }))
 assert.equal(hydrationMessages.length, 0, "no hydration warnings on clean browser")
 assert.equal(pageErrors.length, 0, "no browser errors")
 assert.equal(blockedWrites, 0, "no writes attempted")
} finally { await browser.close() }
