import { backendRoute } from "@/lib/backend/router"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ backend: string[] }> }
async function handle(request: Request, context: Context) {
  const { backend } = await context.params
  return backendRoute(request, backend)
}
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE }
