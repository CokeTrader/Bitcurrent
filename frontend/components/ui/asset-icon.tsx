import * as React from "react"
import { cn } from "@/lib/utils"
import { Bitcoin, CircleDollarSign } from "lucide-react"

// Crypto brand colors from design system
const assetColors: Record<string, string> = {
  BTC: "text-[#F7931A]",
  ETH: "text-[#627EEA]",
  SOL: "text-[#14F195]",
  ADA: "text-[#0033AD]",
  MATIC: "text-[#8247E5]",
  LINK: "text-[#2A5ADA]",
  AVAX: "text-[#E84142]",
  DOT: "text-[#E6007A]",
  USDT: "text-[#26A17B]",
  USDC: "text-[#2775CA]",
  GBP: "text-muted-foreground",
  USD: "text-muted-foreground",
  EUR: "text-muted-foreground",
}

const assetBackgrounds: Record<string, string> = {
  BTC: "bg-[#F7931A]/10",
  ETH: "bg-[#627EEA]/10",
  SOL: "bg-[#14F195]/10",
  ADA: "bg-[#0033AD]/10",
  MATIC: "bg-[#8247E5]/10",
  LINK: "bg-[#2A5ADA]/10",
  AVAX: "bg-[#E84142]/10",
  DOT: "bg-[#E6007A]/10",
  USDT: "bg-[#26A17B]/10",
  USDC: "bg-[#2775CA]/10",
  GBP: "bg-muted",
  USD: "bg-muted",
  EUR: "bg-muted",
}

export interface AssetIconProps extends React.HTMLAttributes<HTMLDivElement> {
  symbol: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "color" | "mono" | "outline"
  showSymbol?: boolean
}

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
}

const iconSizes = {
  xs: "h-2.5 w-2.5",
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-7 w-7",
}

const textSizes = {
  xs: "text-[8px]",
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
}

export function AssetIcon({
  symbol,
  size = "md",
  variant = "color",
  showSymbol = false,
  className,
  ...props
}: AssetIconProps) {
  const normalizedSymbol = symbol.toUpperCase()
  const colorClass = variant === "color" ? assetColors[normalizedSymbol] : "text-foreground"
  const bgClass = variant === "color" ? assetBackgrounds[normalizedSymbol] : "bg-muted"

  // Simple icon mapping (in production, use actual crypto icon library)
  const renderIcon = () => {
    switch (normalizedSymbol) {
      case "BTC":
        return <Bitcoin className={cn(iconSizes[size], colorClass)} />
      case "GBP":
      case "USD":
      case "EUR":
      case "USDT":
      case "USDC":
        return <CircleDollarSign className={cn(iconSizes[size], colorClass)} />
      default:
        // Fallback: show first letter
        return (
          <span className={cn("font-bold", textSizes[size], colorClass)}>
            {normalizedSymbol[0]}
          </span>
        )
    }
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)} {...props}>
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          sizeClasses[size],
          bgClass,
          variant === "outline" && "border-2 border-current"
        )}
      >
        {renderIcon()}
      </div>
      {showSymbol && (
        <span className={cn("font-medium", textSizes[size])}>
          {normalizedSymbol}
        </span>
      )}
    </div>
  )
}







