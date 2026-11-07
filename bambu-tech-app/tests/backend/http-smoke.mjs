// Run against an isolated server with APP_ORIGIN set and Supabase variables absent.
import assert from "node:assert/strict"
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3107"
const cases = [
  ["/admin", {}, 503, "UNAVAILABLE"],
  ["/admin/nested", {}, 503, "UNAVAILABLE"],
  ["/api/admin/products", {}, 503, "UNAVAILABLE"],
  ["/api/admin/session", {}, 503, "UNAVAILABLE"],
  ["/api/catalog/products", {}, 503, "UNAVAILABLE"],
  ["/api/catalog/settings", {}, 503, "UNAVAILABLE"],
  ["/api/admin/products/11111111-1111-4111-8111-111111111111", { method: "POST", headers: { Origin: "https://foreign.example", "Content-Type": "application/json" }, body: "{}" }, 403, "FORBIDDEN"],
  ["/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, 403, "FORBIDDEN"],
  ["/api/unknown", {}, 404, "NOT_FOUND"],
]
for (const [path, options, status, code] of cases) {
  const response = await fetch(new URL(path, base), { ...options, redirect: "manual", signal: AbortSignal.timeout(10000) })
  assert.equal(response.status, status, path)
  assert.match(response.headers.get("cache-control"), /no-store/, path)
  const body = await response.json()
  assert.equal(body.error.code, code, path)
  assert.doesNotMatch(JSON.stringify(body), /service_role|sb_secret_|stack|postgres|SUPABASE_/, path)
  console.log(`PASS ${response.status} ${path}`)
}
