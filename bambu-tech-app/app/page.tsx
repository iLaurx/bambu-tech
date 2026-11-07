import { Catalog } from "@/components/catalog"
import { demoEnabled } from "@/lib/backend/demo"

export default function Page() {
  return <Catalog demo={demoEnabled()} />
}
