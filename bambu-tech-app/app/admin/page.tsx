import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Panel de administración | Bambu Tech",
  description: "Administra el inventario de equipos de Bambu Tech.",
  robots: { index: false, follow: false },
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const parameters = await searchParams
  return <AdminDashboard recovery={parameters.recovery === "1"} />
}
