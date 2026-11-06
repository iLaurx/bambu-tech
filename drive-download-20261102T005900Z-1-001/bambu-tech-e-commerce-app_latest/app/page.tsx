import { Catalog } from "@/components/catalog"
import { PRODUCTS } from "@/lib/products"

export default function Page() {
  return <Catalog products={PRODUCTS} />
}
