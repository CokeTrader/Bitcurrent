import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

export interface PriceChangeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  type?: "percentage" | "absolute"
  currency?: string
  showArrow?: boolean
  size?: "sm" | "md" | "lg"
  animate?: boolean
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

export function PriceChange({
  value,
  type = "percentage",
  currency = "£",
  showArrow = true,
  size = "md",
  animate = false,
  className,
  ...props
}: PriceChangeProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const colorClass = isPositive
    ? "text-success"
    : isNegative
    ? "text-danger"
    : "text-muted-foreground"

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus

  const formattedValue = React.useMemo(() => {
    if (type === "percentage") {
      return `${isPositive ? "+" : ""}${value.toFixed(2)}%`
    } else {
      const absValue = Math.abs(value).toFixed(2)
      return `${isPositive ? "+" : "-"}${currency}${absValue}`
    }
  }, [value, type, currency, isPositive])

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-mono tabular-nums",
        sizeClasses[size],
        colorClass,
        animate && (isPositive ? "price-flash-up" : isNegative ? "price-flash-down" : ""),
        className
      )}
      {...props}
    >
      {showArrow && <Icon className={iconSizes[size]} />}
      <span className="font-semibold">{formattedValue}</span>
    </div>
  )
}




