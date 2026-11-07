import type { ApiErrorCode } from "./contract"
export class BackendError extends Error {
  constructor(public code: ApiErrorCode, message: string, public status: number) { super(message) }
}
export function databaseError(error: { code?: string } | null): void {
  if (!error) return
  if (error.code === "42501") throw new BackendError("FORBIDDEN", "No tienes autorización para esta operación.", 403)
  if (error.code === "P0002") throw new BackendError("NOT_FOUND", "Producto no encontrado.", 404)
  if (error.code === "23505") throw new BackendError("CONFLICT", "El registro ya existe.", 409)
  if (["22023", "22P02", "22003", "23514", "23502"].includes(error.code ?? "")) throw new BackendError("VALIDATION", "Los datos o las referencias de imágenes no son válidos.", 400)
  throw new BackendError("UNAVAILABLE", "No fue posible completar la operación. Inténtalo de nuevo.", 503)
}
