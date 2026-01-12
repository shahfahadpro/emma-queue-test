import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const percentage = value || 0
  
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <div
        className="bg-primary h-full transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
