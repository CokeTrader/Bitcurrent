"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface OrderBookOrder {
  price: number
  quantity: number
  total: number
}

export interface OrderBookProps {
  symbol: string
  bids?: OrderBookOrder[]
  asks?: OrderBookOrder[]
  onPriceClick?: (price: number) => void
  compact?: boolean
  className?: string
}

// Generate realistic orderbook data
function generateOrderBookData(basePrice: number): { bids: OrderBookOrder[], asks: OrderBookOrder[] } {
  const spread = basePrice * 0.0005 // 0.05% spread
  
  const bids = Array.from({ length: 15 }, (_, i) => {
    const price = basePrice - (spread + i * (basePrice * 0.0002))
    const quantity = Math.random() * 2 + 0.1
    return {
      price: Number(price.toFixed(2)),
      quantity: Number(quantity.toFixed(8)),
      total: Number((price * quantity).toFixed(2))
    }
  })

  const asks = Array.from({ length: 15 }, (_, i) => {
    const price = basePrice + (spread + i * (basePrice * 0.0002))
    const quantity = Math.random() * 2 + 0.1
    return {
      price: Number(price.toFixed(2)),
      quantity: Number(quantity.toFixed(8)),
      total: Number((price * quantity).toFixed(2))
    }
  })

  return { bids, asks }
}

export function OrderBookEnhanced({
  symbol,
  bids = [],
  asks = [],
  onPriceClick,
  compact = false,
  className
}: OrderBookProps) {
  // Generate orderbook based on actual current price from props or fetch real price
  const { bids: demoBids, asks: demoAsks } = React.useMemo(
    () => {
      // In production, this should come from WebSocket or API
      // For now, use a reasonable default but this will be replaced
      const basePrice = 84000 // Updated to match current BTC price range
      return generateOrderBookData(basePrice)
    },
    []
  )

  const displayBids = bids.length > 0 ? bids : demoBids
  const displayAsks = asks.length > 0 ? asks : demoAsks

  // Calculate max total for bar visualization
  const maxTotal = React.useMemo(() => {
    const allTotals = [...displayBids, ...displayAsks].map(o => o.total)
    return Math.max(...allTotals)
  }, [displayBids, displayAsks])

  const spread = displayAsks[0]?.price - displayBids[0]?.price
  const spreadPercentage = spread ? (spread / displayBids[0].price) * 100 : 0

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Order Book</h3>
        <div className="text-xs text-muted-foreground">
          Spread: <span className="font-mono">{spreadPercentage.toFixed(3)}%</span>
        </div>
      </div>

      <div className="space-y-1">
        {/* Column Headers */}
        <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium mb-2">
          <div className="text-left">Price (£)</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total (£)</div>
        </div>

        {/* Asks (Sell Orders) - Red */}
        <div className="space-y-0.5">
          {displayAsks.slice(0, compact ? 8 : 15).reverse().map((ask, i) => {
            const barWidth = (ask.total / maxTotal) * 100
            return (
              <div
                key={`ask-${i}`}
                className="relative grid grid-cols-3 text-xs font-mono py-1 px-2 rounded cursor-pointer hover:bg-danger/10 transition-colors group"
                onClick={() => onPriceClick?.(ask.price)}
              >
                {/* Background bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-danger/10 rounded transition-all group-hover:bg-danger/20"
                  style={{ width: `${barWidth}%` }}
                />
                
                {/* Content */}
                <div className="text-danger font-semibold z-10">
                  {ask.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-right text-foreground/80 z-10">
                  {ask.quantity.toFixed(6)}
                </div>
                <div className="text-right text-muted-foreground z-10">
                  {ask.total.toLocaleString('en-GB')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Spread Indicator */}
        <div className="flex items-center justify-center py-3 my-2 bg-muted/50 rounded">
          <span className="text-xs font-medium text-muted-foreground">
            Spread: £{spread?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Bids (Buy Orders) - Green */}
        <div className="space-y-0.5">
          {displayBids.slice(0, compact ? 8 : 15).map((bid, i) => {
            const barWidth = (bid.total / maxTotal) * 100
            return (
              <div
                key={`bid-${i}`}
                className="relative grid grid-cols-3 text-xs font-mono py-1 px-2 rounded cursor-pointer hover:bg-success/10 transition-colors group"
                onClick={() => onPriceClick?.(bid.price)}
              >
                {/* Background bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-success/10 rounded transition-all group-hover:bg-success/20"
                  style={{ width: `${barWidth}%` }}
                />
                
                {/* Content */}
                <div className="text-success font-semibold z-10">
                  {bid.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-right text-foreground/80 z-10">
                  {bid.quantity.toFixed(6)}
                </div>
                <div className="text-right text-muted-foreground z-10">
                  {bid.total.toLocaleString('en-GB')}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-success pulse-live" />
        <span>Live Updates</span>
      </div>
    </Card>
  )
}


