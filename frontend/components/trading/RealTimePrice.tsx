"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PriceChange } from "@/components/ui/price-change"
import { useWebSocketPrice } from "@/hooks/use-websocket-price"
import { useCoinPrice } from "@/hooks/use-market-data"
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RealTimePriceProps {
  symbol: string
  size?: "sm" | "md" | "lg" | "xl"
  showChange?: boolean
  showStatus?: boolean
  className?: string
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
}

export function RealTimePrice({
  symbol,
  size = "lg",
  showChange = true,
  showStatus = true,
  className
}: RealTimePriceProps) {
  const [baseAsset] = symbol.split("-")
  const coinIdMap: Record<string, string> = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "ADA": "cardano",
  }
  
  const coinId = coinIdMap[baseAsset] || "bitcoin"
  
  // Try WebSocket first, fallback to API
  const { priceData: wsPrice, isConnected } = useWebSocketPrice(symbol)
  const { data: apiPrice } = useCoinPrice(coinId, 'gbp')

  const [previousPrice, setPreviousPrice] = React.useState<number | null>(null)
  const [flashDirection, setFlashDirection] = React.useState<'up' | 'down' | null>(null)

  // Extract current price
  const currentPrice = React.useMemo(() => {
    if (wsPrice) return wsPrice.price
    if (apiPrice && typeof apiPrice === 'object' && coinId in apiPrice) {
      return (apiPrice as any)[coinId]?.gbp
    }
    return null
  }, [wsPrice, apiPrice, coinId])

  const change24h = wsPrice?.change24h || (apiPrice as any)?.[coinId]?.gbp_24h_change || 0

  // Flash effect when price changes
  React.useEffect(() => {
    if (currentPrice !== null && previousPrice !== null && currentPrice !== previousPrice) {
      setFlashDirection(currentPrice > previousPrice ? 'up' : 'down')
      setTimeout(() => setFlashDirection(null), 400)
    }
    if (currentPrice !== null) {
      setPreviousPrice(currentPrice)
    }
  }, [currentPrice, previousPrice])

  if (!currentPrice) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-12 w-48 bg-muted rounded-lg" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline gap-4">
        <motion.div
          key={currentPrice}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className={cn(
            "font-mono font-bold tabular-nums",
            sizeClasses[size],
            flashDirection === 'up' && "price-flash-up",
            flashDirection === 'down' && "price-flash-down"
          )}
        >
          £{currentPrice.toLocaleString('en-GB', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </motion.div>

        {showChange && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <PriceChange value={change24h} type="percentage" size="md" animate />
          </motion.div>
        )}
      </div>

      {showStatus && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-success" />
              <span className="text-success font-medium">Live</span>
              <span>• Updates in real-time</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-warning" />
              <span className="text-warning font-medium">API</span>
              <span>• Updates every 10s</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}



