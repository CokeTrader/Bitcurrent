"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PriceDisplayProps {
  price: number
  change24h?: number
  currency?: string
  size?: "sm" | "md" | "lg" | "xl"
  showTrend?: boolean
  className?: string
}

const sizeClasses = {
  sm: "text-base",
  md: "text-price-medium font-medium",
  lg: "text-price-large font-semibold",
  xl: "text-portfolio font-bold",
}

export function PriceDisplay({
  price,
  change24h,
  currency = "GBP",
  size = "md",
  showTrend = true,
  className,
}: PriceDisplayProps) {
  const isPositive = change24h !== undefined && change24h >= 0
  const [announced, setAnnounced] = React.useState(false)
  
  // Rate-limit ARIA announcements (only announce significant changes)
  React.useEffect(() => {
    if (Math.abs(change24h || 0) > 1 && !announced) {
      setAnnounced(true)
      setTimeout(() => setAnnounced(false), 60000) // Reset after 60s
    }
  }, [change24h, announced])

  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)

  const formattedChange = change24h !== undefined 
    ? `${isPositive ? '+' : ''}${change24h.toFixed(2)}%` 
    : null

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span 
        className={cn("font-mono tabular-nums", sizeClasses[size])}
        aria-label={`Price: ${formattedPrice}`}
      >
        {formattedPrice}
      </span>
      
      {change24h !== undefined && showTrend && (
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-buy" : "text-sell"
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-4 w-4" aria-hidden="true" />
          )}
          {formattedChange}
        </span>
      )}
    </div>
  )
}



