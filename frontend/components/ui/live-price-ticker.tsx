"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card } from "./card"

interface PriceData {
  symbol: string
  price: number
  change24h: number
}

export function LivePriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: 'BTC', price: 115472, change24h: 3.82 },
    { symbol: 'ETH', price: 4142.64, change24h: 10.47 },
    { symbol: 'XRP', price: 2.54, change24h: 5.83 },
    { symbol: 'SOL', price: 245.12, change24h: 8.91 },
  ])

  // Simulate live price updates (replace with real WebSocket later)
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(coin => ({
        ...coin,
        price: coin.price * (1 + (Math.random() - 0.5) * 0.001),
        change24h: coin.change24h + (Math.random() - 0.5) * 0.1
      })))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-muted/30 border-y py-3 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
          {prices.map((coin) => (
            <div key={coin.symbol} className="flex items-center gap-3 min-w-fit">
              <span className="font-semibold text-sm">{coin.symbol}</span>
              <span className="text-sm font-mono">
                ${coin.price.toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {coin.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(coin.change24h).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

