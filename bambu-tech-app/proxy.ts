import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseConfig } from "./lib/backend/config"
import { failure } from "./lib/backend/http"
import { BackendError, databaseError } from "./lib/backend/errors"

export async function proxy(request: NextRequest) {
  // Only these exact pages are public. Their API calls still enforce the server contract.
  if (["/admin/login", "/admin/recovery"].includes(request.nextUrl.pathname)) {
    const publicPage = NextResponse.next({ request })
    publicPage.headers.set("Cache-Control", "private, no-store")
    return publicPage
  }
  let response = NextResponse.next({ request })
  try {
    const { url, key } = supabaseConfig()
    const client = createServerClient(url, key, {
      cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
        },
      },
    })
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user) throw new BackendError("UNAUTHORIZED", "Inicia sesión mediante el acceso administrativo.", 401)
    const membership = await client.rpc("admin_session")
    databaseError(membership.error)
    if (membership.data !== true) throw new BackendError("FORBIDDEN", "Tu cuenta no tiene acceso administrativo.", 403)
    response.headers.set("Cache-Control", "private, no-store")
    return response
  } catch (error) {
    const denied = error instanceof BackendError && error.status === 401
      ? NextResponse.redirect(new URL("/admin/login", request.url), { status: 303, headers: { "Cache-Control": "private, no-store" } })
      : failure(error)
    response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie))
    return denied
  }
}
export const config = { matcher: ["/admin/:path*"] }
