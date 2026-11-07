import type { Metadata } from "next"
import { AuthPanel } from "@/components/admin/auth-panel"
export const metadata: Metadata = { title: "Recuperar acceso | Bambu Tech", robots: { index: false, follow: false } }
export default function RecoveryPage() { return <AuthPanel mode="recovery" /> }
