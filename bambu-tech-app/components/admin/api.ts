import type { ApiErrorCode, ApiResult } from "@/lib/backend/contract"

export class AdminApiError extends Error {
  constructor(message: string, public status = 0, public code?: ApiErrorCode) { super(message) }
  get requiresLogin() { return this.status === 401 || this.status === 403 }
}

export class ProductAlreadySavedError extends AdminApiError {
  constructor() { super("El producto ya existe en el servidor. Conservamos tus datos: revisa el formulario y guarda como edición para confirmar los cambios.", 409, "CONFLICT") }
}

// Same-origin cookies stay HttpOnly. This module never imports Supabase or its configuration.
export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...options, credentials: "same-origin", cache: "no-store",
      headers: { ...(typeof options.body === "string" ? { "Content-Type": "application/json" } : {}), ...options.headers },
      signal: options.signal ?? AbortSignal.timeout(30000),
    })
  } catch {
    throw new AdminApiError("No se confirmó la operación. Revisa tu conexión y actualiza el inventario antes de volver a guardar.")
  }
  let parsed: unknown
  try { parsed = await response.json() } catch {
    throw new AdminApiError("No fue posible leer la respuesta del servicio. Inténtalo de nuevo.", response.status)
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new AdminApiError("La respuesta del servicio no es válida.", response.status)
  const result = parsed as ApiResult<T>
  if (!response.ok || !result || "error" in result) {
    const error = result && "error" in result ? result.error : null
    throw new AdminApiError(error?.message || "No fue posible completar la operación.", response.status, error?.code)
  }
  if (!("data" in result)) throw new AdminApiError("La respuesta del servicio no es válida.", response.status)
  return result.data
}

export const errorMessage = (error: unknown) => error instanceof AdminApiError || error instanceof Error
  ? error.message : "No fue posible completar la operación."
