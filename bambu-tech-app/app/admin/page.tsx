import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { PRODUCTS } from "@/lib/products"

export const metadata: Metadata = {
  title: "Panel de administración | Bambu Tech",
  description: "Administra el inventario de equipos de Bambu Tech.",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard initialProducts={PRODUCTS} />
}
