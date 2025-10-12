"use client"

import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Trade {
  id: string
  price: number
  quantity: number
  time: string
  side: "buy" | "sell"
}

export function RecentTrades({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<Trade[]>([])

  // Simulate recent trades (replace with real WebSocket later)
  useEffect(() => {
    const generateTrades = () => {
      const basePrice = 60000
      const newTrades: Trade[] = []
      
      for (let i = 0; i < 20; i++) {
        const side = Math.random() > 0.5 ? "buy" : "sell"
        newTrades.push({
          id: `trade_${Date.now()}_${i}`,
          price: basePrice + (Math.random() - 0.5) * 200,
          quantity: Math.random() * 0.5,
          time: new Date(Date.now() - i * 1000).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          side
        })
      }
      
      setTrades(newTrades)
    }
    
    generateTrades()
    const interval = setInterval(generateTrades, 3000)
    
    return () => clearInterval(interval)
  }, [symbol])

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">Recent Trades</h3>
      
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground mb-2">
        <div>Price (GBP)</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Time</div>
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {trades.map((trade) => (
          <div 
            key={trade.id}
            className={`grid grid-cols-3 gap-2 text-xs py-1 ${
              trade.side === "buy" ? "text-green-600" : "text-red-600"
            }`}
          >
            <div className="font-mono flex items-center gap-1">
              {trade.side === "buy" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trade.price.toLocaleString('en-GB', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </div>
            <div className="text-right font-mono text-foreground">
              {trade.quantity.toFixed(4)}
            </div>
            <div className="text-right font-mono text-muted-foreground">
              {trade.time}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

