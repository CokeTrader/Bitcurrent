"use client"

import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

export function MarketDepth({ symbol }: { symbol: string }) {
  const [bids, setBids] = useState<OrderBookEntry[]>([])
  const [asks, setAsks] = useState<OrderBookEntry[]>([])

  // Simulate order book data (replace with real WebSocket later)
  useEffect(() => {
    const generateOrders = () => {
      const basePrice = 60000 // BTC price
      const newBids: OrderBookEntry[] = []
      const newAsks: OrderBookEntry[] = []
      
      for (let i = 0; i < 10; i++) {
        newBids.push({
          price: basePrice - (i * 50),
          quantity: Math.random() * 2,
          total: 0
        })
        
        newAsks.push({
          price: basePrice + (i * 50),
          quantity: Math.random() * 2,
          total: 0
        })
      }
      
      // Calculate totals
      let bidTotal = 0
      newBids.forEach(bid => {
        bidTotal += bid.quantity
        bid.total = bidTotal
      })
      
      let askTotal = 0
      newAsks.forEach(ask => {
        askTotal += ask.quantity
        ask.total = askTotal
      })
      
      setBids(newBids)
      setAsks(newAsks)
    }
    
    generateOrders()
    const interval = setInterval(generateOrders, 5000)
    
    return () => clearInterval(interval)
  }, [symbol])

  const maxTotal = Math.max(
    bids[bids.length - 1]?.total || 0,
    asks[asks.length - 1]?.total || 0
  )

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">Order Book</h3>
      
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground mb-2">
        <div>Price (GBP)</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="space-y-1 mb-4">
        {asks.reverse().slice(0, 5).map((ask, idx) => (
          <div key={idx} className="relative">
            <div 
              className="absolute inset-0 bg-red-500/10"
              style={{ width: `${(ask.total / maxTotal) * 100}%` }}
            />
            <div className="relative grid grid-cols-3 gap-2 text-xs py-1">
              <div className="text-red-600 font-mono">{ask.price.toLocaleString()}</div>
              <div className="text-right font-mono">{ask.quantity.toFixed(4)}</div>
              <div className="text-right font-mono text-muted-foreground">{ask.total.toFixed(4)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="py-2 text-center bg-muted/50 rounded mb-4">
        <div className="text-xs text-muted-foreground">Spread</div>
        <div className="text-sm font-bold">
          £{((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)).toFixed(2)}
        </div>
      </div>

      {/* Bids (Buy Orders) */}
      <div className="space-y-1">
        {bids.slice(0, 5).map((bid, idx) => (
          <div key={idx} className="relative">
            <div 
              className="absolute inset-0 bg-green-500/10"
              style={{ width: `${(bid.total / maxTotal) * 100}%` }}
            />
            <div className="relative grid grid-cols-3 gap-2 text-xs py-1">
              <div className="text-green-600 font-mono">{bid.price.toLocaleString()}</div>
              <div className="text-right font-mono">{bid.quantity.toFixed(4)}</div>
              <div className="text-right font-mono text-muted-foreground">{bid.total.toFixed(4)}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

