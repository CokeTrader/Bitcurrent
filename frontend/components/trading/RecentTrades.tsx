"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

export interface Trade {
  id: string
  price: number
  amount: number
  side: 'buy' | 'sell'
  timestamp: number
}

export interface RecentTradesProps {
  symbol: string
  trades?: Trade[]
  limit?: number
  className?: string
}

// Generate realistic recent trades
function generateRecentTrades(currentPrice: number, count: number = 20): Trade[] {
  const trades: Trade[] = []
  const now = Date.now()
  
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const priceVariation = (Math.random() - 0.5) * currentPrice * 0.001
    const price = currentPrice + priceVariation
    const amount = Math.random() * 0.5 + 0.01
    
    trades.push({
      id: `trade-${i}`,
      price,
      amount,
      side,
      timestamp: now - (i * 1000 * (Math.random() * 60)) // Random times in last hour
    })
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp)
}

export function RecentTrades({
  symbol,
  trades,
  limit = 20,
  className
}: RecentTradesProps) {
  const [displayTrades, setDisplayTrades] = React.useState<Trade[]>([])
  const [newTradeId, setNewTradeId] = React.useState<string | null>(null)

  // Initialize with generated trades if none provided
  React.useEffect(() => {
    if (!trades) {
      // Get price from somewhere - in production from props or context
      setDisplayTrades(generateRecentTrades(84092, limit))
    } else {
      setDisplayTrades(trades.slice(0, limit))
    }
  }, [trades, limit])

  // Simulate new trades coming in
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (displayTrades.length > 0) {
        const latestPrice = displayTrades[0].price
        const newTrade: Trade = {
          id: `trade-${Date.now()}`,
          price: latestPrice + (Math.random() - 0.5) * latestPrice * 0.001,
          amount: Math.random() * 0.5 + 0.01,
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          timestamp: Date.now()
        }
        
        setNewTradeId(newTrade.id)
        setDisplayTrades(prev => [newTrade, ...prev.slice(0, limit - 1)])
        
        setTimeout(() => setNewTradeId(null), 800)
      }
    }, 3000 + Math.random() * 2000) // Random 3-5 seconds

    return () => clearInterval(interval)
  }, [displayTrades, limit])

  return (
    <Card className={cn("p-4", className)}>
      <h3 className="font-semibold text-sm mb-4">Recent Trades</h3>

      <div className="space-y-1">
        {/* Column Headers */}
        <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium mb-2 px-2">
          <div className="text-left">Price (£)</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Time</div>
        </div>

        {/* Trades List */}
        <div className="space-y-0.5 max-h-[500px] overflow-y-auto custom-scrollbar">
          {displayTrades.map((trade, index) => {
            const isNew = trade.id === newTradeId
            const timeDiff = Date.now() - trade.timestamp
            const timeAgo = timeDiff < 60000 
              ? `${Math.floor(timeDiff / 1000)}s ago`
              : `${Math.floor(timeDiff / 60000)}m ago`

            return (
              <motion.div
                key={trade.id}
                initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={cn(
                  "grid grid-cols-3 text-sm font-mono py-2 px-2 rounded transition-all",
                  isNew && (trade.side === 'buy' ? 'bg-success/20' : 'bg-danger/20'),
                  !isNew && "hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "font-semibold flex items-center gap-1",
                  trade.side === 'buy' ? "text-success" : "text-danger"
                )}>
                  {trade.side === 'buy' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trade.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-right text-foreground/80">
                  {trade.amount.toFixed(6)}
                </div>
                <div className="text-right text-muted-foreground text-xs">
                  {timeAgo}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground border-t border-border pt-4">
        <div className="h-2 w-2 rounded-full bg-success pulse-live" />
        <span>Live Trade Feed</span>
      </div>
    </Card>
  )
}






