// Run with: node --conditions=react-server --import tsx tests/backend/development-origin.mjs
import assert from "node:assert/strict"
import { assertOrigin } from "../../lib/backend/http.ts"

process.env.APP_ORIGIN = "http://localhost:3000"
process.env.NODE_ENV = "development"
const check = (url, origin, site = "same-origin") => assertOrigin(new Request(`${url}/api/auth/login`, {
  method: "POST", headers: { ...(origin ? { origin } : {}), "sec-fetch-site": site },
}))
for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.4:3000"]) {
  assert.doesNotThrow(() => check(origin, origin))
}
for (const [url, origin, site] of [
  ["http://192.168.1.4:3000", "http://192.168.1.5:3000", "same-origin"],
  ["http://192.168.1.4:3000", "http://192.168.1.4:3001", "same-origin"],
  ["http://localhost:3000", "http://192.168.1.4:3000", "same-site"],
  ["http://192.168.1.4:3000", "http://192.168.1.4:3000", "cross-site"],
  ["http://192.168.1.4:3000", null, "same-origin"],
]) assert.throws(() => check(url, origin, site))

process.env.NODE_ENV = "production"
process.env.APP_ORIGIN = "https://example.test"
assert.doesNotThrow(() => check("https://example.test", "https://example.test"))
assert.throws(() => check("http://192.168.1.4:3000", "http://192.168.1.4:3000"))
console.log("Origin development and production checks passed")
