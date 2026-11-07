import "server-only"
import { NextResponse } from "next/server"
import { appOrigin } from "./config"
import { BackendError } from "./errors"
import { ValidationError } from "./validation"

export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin")
  const configuredOrigin = appOrigin()
  const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.4:3000"]
  const localMatch = process.env.NODE_ENV === "development" && origin !== null && localOrigins.includes(origin) && new URL(request.url).origin === origin
  if ((!localMatch && origin !== configuredOrigin) || request.headers.get("sec-fetch-site") === "cross-site") throw new BackendError("FORBIDDEN", "Origen de solicitud no permitido.", 403)
}
export async function jsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ValidationError("Se esperaba contenido JSON.")
  const raw = await readLimited(request, 64 * 1024)
  try { return JSON.parse(raw.toString("utf8")) } catch { throw new ValidationError("JSON inválido.") }
}
export async function readLimited(request: Request, maxBytes: number): Promise<Buffer> {
  const length = request.headers.get("content-length")
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new ValidationError("La solicitud excede el tamaño permitido.")
  if (!request.body) throw new ValidationError("La solicitud está vacía.")
  const reader = request.body.getReader()
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new ValidationError("La solicitud excede el tamaño permitido.") }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks)
}
export function failure(error: unknown): NextResponse {
  const known = error instanceof BackendError ? error : error instanceof ValidationError
    ? new BackendError("VALIDATION", error.message, 400)
    : new BackendError("INTERNAL", "Ocurrió un error al procesar la solicitud.", 500)
  return NextResponse.json({ error: { code: known.code, message: known.message } }, { status: known.status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } })
}
export async function endpoint<T>(request: Request, callback: () => Promise<T>, status = 200) {
  try {
    if (!["GET", "HEAD"].includes(request.method)) assertOrigin(request)
    const data = await callback()
    return NextResponse.json({ data }, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } })
  } catch (error) { return failure(error) }
}
