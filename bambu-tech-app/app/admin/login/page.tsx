import type { Metadata } from "next"
import { AuthPanel } from "@/components/admin/auth-panel"
export const metadata: Metadata = { title: "Iniciar sesión | Bambu Tech", robots: { index: false, follow: false } }
export default function LoginPage() { return <AuthPanel mode="login" /> }
