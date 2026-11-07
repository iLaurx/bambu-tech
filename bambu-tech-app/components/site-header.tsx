import { Search, Smartphone } from "lucide-react"
import { Input } from "@/components/ui/input"

type SiteHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
}

export function SiteHeader({ query, onQueryChange }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2.5" aria-label="Bambu Tech, inicio">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Bambu Tech</span>
        </a>

        <div role="search" className="relative w-full sm:max-w-md">
          <label htmlFor="search-phones" className="sr-only">
            Buscar producto o marca
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="search-phones"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar producto o marca"
            className="h-10 rounded-full bg-muted/60 pl-9"
            autoComplete="off"
          />
        </div>
      </div>
    </header>
  )
}
