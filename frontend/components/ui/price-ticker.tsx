"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/lib/websocket"
import { TrendingUp, TrendingDown } from "lucide-react"

interface TickerItem {
  symbol: string
  price: number
  change24h: number
}

export function PriceTicker() {
  const [tickers, setTickers] = React.useState<TickerItem[]>([])
  
  // Fetch REAL prices from CoinGecko
  React.useEffect(() => {
    async function fetchTickers() {
      try {
        const { coinGeckoService } = await import("@/lib/coingecko")
        const liveData = await coinGeckoService.getTickerData()
        
        const tickerItems: TickerItem[] = liveData.slice(0, 6).map((coin: any) => ({
          symbol: `${coin.baseAsset}/GBP`,
          price: coin.price,
          change24h: coin.change24h,
        }))
        
        setTickers(tickerItems)
      } catch (error) {
        console.error("Failed to fetch ticker data:", error)
        // Fallback to demo data
        setTickers([
          { symbol: 'BTC/GBP', price: 43250.50, change24h: 2.34 },
          { symbol: 'ETH/GBP', price: 2845.75, change24h: -1.23 },
          { symbol: 'BNB/GBP', price: 425.30, change24h: 0.87 },
          { symbol: 'SOL/GBP', price: 145.25, change24h: 4.56 },
        ])
      }
    }
    
    fetchTickers()
    
    // Refresh every 15 seconds for live feel
    const interval = setInterval(fetchTickers, 15000)
    return () => clearInterval(interval)
  }, [])
  
  // WebSocket disabled for now to avoid connection spam when backend is unavailable
  // TODO: Re-enable when backend WebSocket server is running
  // const { data: btcPrice } = useWebSocket<TickerItem>('ticker:BTC-GBP')
  // const { data: ethPrice } = useWebSocket<TickerItem>('ticker:ETH-GBP')

  return (
    <div 
      className="w-full bg-card border-b border-border overflow-hidden"
      role="marquee"
      aria-live="off"
      aria-label="Live cryptocurrency prices"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-8 animate-scroll overflow-x-auto scrollbar-hide">
          {tickers.map((ticker) => {
            const isPositive = ticker.change24h >= 0
            return (
              <div
                key={ticker.symbol}
                className="flex items-center gap-3 whitespace-nowrap flex-shrink-0"
              >
                <span className="text-sm font-semibold text-foreground">
                  {ticker.symbol}
                </span>
                <span className="text-sm font-mono tabular-nums font-medium">
                  £{ticker.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    isPositive ? "text-buy" : "text-sell"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  )}
                  {isPositive ? '+' : ''}{ticker.change24h.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

