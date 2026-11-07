// Read-only public Auth configuration and local callback readiness. Never sends email.
try { process.loadEnvFile(".env.local") } catch { console.log(JSON.stringify({ setupReady: false })); process.exit(1) }
if (new URL(process.env.SUPABASE_URL).hostname !== "ewnzafbdmtdjnhgrbcof.supabase.co") {
  console.log(JSON.stringify({ expectedProject: false })); process.exit(1)
}
try {
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY }, signal: AbortSignal.timeout(12000),
  })
  const settings = await response.json()
  console.log(JSON.stringify({ authConfiguration: {
    status: response.status,
    disableSignupKnown: typeof settings.disable_signup === "boolean",
    disableSignup: typeof settings.disable_signup === "boolean" ? settings.disable_signup : null,
    emailProviderEnabled: typeof settings.external?.email === "boolean" ? settings.external.email : null,
    mailerAutoconfirm: typeof settings.mailer_autoconfirm === "boolean" ? settings.mailer_autoconfirm : null,
    redirectAllowlistExposed: Object.hasOwn(settings, "uri_allow_list") || Object.hasOwn(settings, "additional_redirect_urls"),
  } }))
} catch { console.log(JSON.stringify({ authConfiguration: { connectionFailed: true } })) }
const localOrigin = process.env.APP_ORIGIN
if (localOrigin !== "http://localhost:3000") {
  console.log(JSON.stringify({ localOriginMatchesExpected: false })); process.exit(0)
}
console.log(JSON.stringify({ localOriginMatchesExpected: true }))
for (const [name, path] of [["settingsRoute", "/api/catalog/settings"], ["recoveryCallbackWithoutCode", "/api/auth/callback"]]) {
  try {
    const response = await fetch(new URL(path, localOrigin), { redirect: "manual", signal: AbortSignal.timeout(20000) })
    console.log(JSON.stringify({ [name]: { status: response.status, ready: response.status === (name === "settingsRoute" ? 200 : 400) } }))
    await response.body?.cancel()
  } catch { console.log(JSON.stringify({ [name]: { connectionFailed: true } })) }
}
