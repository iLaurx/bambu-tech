import { Badge } from "@/components/ui/badge"
import type { Condition } from "@/lib/products"
import { cn } from "@/lib/utils"

export function ConditionBadge({ condition, className }: { condition: Condition; className?: string }) {
  return (
    <Badge
      className={cn(
        "h-6 px-2.5 shadow-sm",
        condition === "Nuevo" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
        className,
      )}
    >
      {condition}
    </Badge>
  )
}
