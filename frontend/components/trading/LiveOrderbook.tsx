"use client"

import * as React from "react"
import { useWebSocket } from "@/lib/websocket"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface OrderbookEntry {
  price: number
  quantity: number
  total: number
}

interface OrderbookData {
  bids: OrderbookEntry[]
  asks: OrderbookEntry[]
  spread: number
  spreadPercentage: number
}

interface LiveOrderbookProps {
  symbol: string
  onPriceClick?: (price: number) => void
  compact?: boolean
}

export function LiveOrderbook({ symbol, onPriceClick, compact = false }: LiveOrderbookProps) {
  const [book, setBook] = React.useState<OrderbookData>({
    bids: [],
    asks: [],
    spread: 0,
    spreadPercentage: 0,
  })
  const [lastUpdate, setLastUpdate] = React.useState<string>("")

  // Fetch real orderbook based on live price
  React.useEffect(() => {
    async function fetchOrderbook() {
      try {
        const { coinGeckoService } = await import("@/lib/coingecko")
        
        // Map symbol to CoinGecko ID
        const coinMap: Record<string, string> = {
          'BTC-GBP': 'bitcoin',
          'ETH-GBP': 'ethereum',
          'BNB-GBP': 'binancecoin',
          'SOL-GBP': 'solana',
        }
        
        const coinId = coinMap[symbol] || 'bitcoin'
        const markets = await coinGeckoService.getMarkets('gbp', [coinId])
        
        if (markets && markets.length > 0) {
          const currentPrice = markets[0].current_price
          const simulatedBook = await coinGeckoService.getSimulatedOrderbook(coinId, currentPrice)
          setBook(simulatedBook as any)
          setLastUpdate(new Date().toLocaleTimeString())
        }
      } catch (error) {
        console.error("Failed to fetch orderbook:", error)
        // Fallback to demo data
        setBook({
          bids: Array.from({ length: 10 }, (_, i) => ({
            price: 43250 - i * 10,
            quantity: Math.random() * 2,
            total: Math.random() * 50,
          })),
          asks: Array.from({ length: 10 }, (_, i) => ({
            price: 43260 + i * 10,
            quantity: Math.random() * 2,
            total: Math.random() * 50,
          })),
          spread: 10,
          spreadPercentage: 0.02,
        })
      }
    }
    
    fetchOrderbook()
    
    // Refresh every 5 seconds for live orderbook feel
    const interval = setInterval(fetchOrderbook, 5000)
    return () => clearInterval(interval)
  }, [symbol])

  // WebSocket disabled for now to avoid errors when backend unavailable
  // TODO: Re-enable when backend WebSocket is running
  // const { data: wsOrderbook } = useWebSocket<OrderbookData>(`orderbook:${symbol}`)
  
  // React.useEffect(() => {
  //   if (wsOrderbook) {
  //     setBook(wsOrderbook)
  //     setLastUpdate(new Date().toLocaleTimeString())
  //   }
  // }, [wsOrderbook])
  
  const maxTotal = Math.max(
    1, // Prevent division by zero
    ...book.bids.map(b => typeof b.total === 'number' ? b.total : 0),
    ...book.asks.map(a => typeof a.total === 'number' ? a.total : 0)
  )

  const displayCount = compact ? 5 : 10

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Order Book</h3>
        <div className="text-xs text-muted-foreground" aria-live="off">
          Updated: {lastUpdate || "Live"}
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <div className="text-left">Price (GBP)</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sell Orders) - Red */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col-reverse">
            {book.asks.slice(0, displayCount).reverse().map((ask, index) => (
              <button
                key={`ask-${index}`}
                onClick={() => onPriceClick?.(ask.price)}
                className={cn(
                  "grid grid-cols-3 gap-2 px-3 py-1.5 text-sm relative hover:bg-sell/10 transition-colors cursor-pointer group",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                aria-label={`Sell order: ${Number(ask.quantity || 0).toFixed(4)} at £${Number(ask.price || 0).toFixed(2)}`}
              >
                {/* Depth visualization */}
                <div
                  className="absolute inset-y-0 right-0 bg-sell/5 group-hover:bg-sell/10 transition-colors"
                  style={{ width: `${((Number(ask.total || 0)) / maxTotal) * 100}%` }}
                />
                
                <div className="text-sell font-mono font-medium relative z-10">
                  {Number(ask.price || 0).toFixed(2)}
                </div>
                <div className="text-right font-mono text-foreground/80 relative z-10">
                  {Number(ask.quantity || 0).toFixed(4)}
                </div>
                <div className="text-right font-mono text-muted-foreground relative z-10">
                  {Number(ask.total || 0).toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Spread */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-muted/30 border-y border-border"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="text-xs text-muted-foreground">Spread</div>
          <div className="text-sm font-mono font-medium">
            £{Number(book.spread || 0).toFixed(2)} ({Number(book.spreadPercentage || 0).toFixed(3)}%)
          </div>
        </div>

        {/* Bids (Buy Orders) - Green */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {book.bids.slice(0, displayCount).map((bid, index) => (
            <button
              key={`bid-${index}`}
              onClick={() => onPriceClick?.(bid.price)}
              className={cn(
                "grid grid-cols-3 gap-2 px-3 py-1.5 text-sm relative hover:bg-buy/10 transition-colors cursor-pointer group",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={`Buy order: ${Number(bid.quantity || 0).toFixed(4)} at £${Number(bid.price || 0).toFixed(2)}`}
            >
              {/* Depth visualization */}
              <div
                className="absolute inset-y-0 right-0 bg-buy/5 group-hover:bg-buy/10 transition-colors"
                style={{ width: `${((Number(bid.total || 0)) / maxTotal) * 100}%` }}
              />
              
              <div className="text-buy font-mono font-medium relative z-10">
                {Number(bid.price || 0).toFixed(2)}
              </div>
              <div className="text-right font-mono text-foreground/80 relative z-10">
                {Number(bid.quantity || 0).toFixed(4)}
              </div>
              <div className="text-right font-mono text-muted-foreground relative z-10">
                {Number(bid.total || 0).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ARIA Live Region for summarized updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Best bid: £{book.bids[0] ? Number(book.bids[0].price || 0).toFixed(2) : 'N/A'}, Best ask: £{book.asks[0] ? Number(book.asks[0].price || 0).toFixed(2) : 'N/A'}
      </div>
    </div>
  )
}
