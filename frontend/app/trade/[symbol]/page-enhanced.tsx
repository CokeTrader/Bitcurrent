"use client"

import * as React from "react"
import { OrderBookEnhanced } from "@/components/trading/OrderBookEnhanced"
import { TradeFormEnhanced } from "@/components/trading/TradeFormEnhanced"
import { TradingChart } from "@/components/trading/TradingChart"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AssetIcon } from "@/components/ui/asset-icon"
import { PriceChange } from "@/components/ui/price-change"
import { useCoinPrice } from "@/hooks/use-market-data"
import { 
  Star, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TradePageProps {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const { symbol } = params
  const [baseAsset, quoteAsset] = symbol.split("-")

  // Get real-time price data
  const coinIdMap: Record<string, string> = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "ADA": "cardano",
  }

  const coinId = coinIdMap[baseAsset] || "bitcoin"
  const { data: priceData } = useCoinPrice(coinId, 'gbp')

  // Extract REAL price from CoinGecko - NO FALLBACK!
  const currentPrice = React.useMemo(() => {
    if (priceData && typeof priceData === 'object' && coinId in priceData) {
      return (priceData as any)[coinId]?.gbp || null
    }
    return null
  }, [priceData, coinId])
  
  // Only show trading interface if we have real price data
  if (!currentPrice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 skeleton rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading real-time price data...</p>
        </div>
      </div>
    )
  }
  const [isFavorite, setIsFavorite] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"orders" | "history" | "trades">("orders")

  // Sample data for 24h stats
  const stats = {
    high24h: currentPrice * 1.08,
    low24h: currentPrice * 0.94,
    volume24h: 2300000000,
    change24h: 5.46
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Market Info */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="hover:scale-110 transition-transform"
              >
                <Star 
                  className={cn(
                    "h-5 w-5",
                    isFavorite ? "fill-warning text-warning" : "text-muted-foreground"
                  )}
                />
              </button>
              <div className="flex items-center gap-3">
                <AssetIcon symbol={baseAsset} size="lg" />
                <div>
                  <h1 className="text-2xl font-bold">{symbol}</h1>
                  <p className="text-sm text-muted-foreground">{baseAsset} / {quoteAsset}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Last Price</p>
                <p className="text-3xl font-bold font-mono">
                  £{currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Change</p>
                <PriceChange value={stats.change24h} type="percentage" size="lg" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h High</p>
                <p className="font-mono font-semibold text-success">
                  £{stats.high24h.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Low</p>
                <p className="font-mono font-semibold text-danger">
                  £{stats.low24h.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="font-mono font-semibold">
                  £{(stats.volume24h / 1000000000).toFixed(2)}B
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trading Interface - 3 Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Order Book (3/12) */}
          <div className="lg:col-span-3">
            <OrderBookEnhanced
              symbol={symbol}
              onPriceClick={(price) => {
                console.log("Price clicked:", price)
                // In production, this would fill the order form
              }}
            />
          </div>

          {/* Center Column - Chart (6/12) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Trading Chart */}
            <TradingChart symbol={symbol} className="h-[500px]" />

            {/* Bottom Tabs - Orders, History, Trades */}
            <Card>
              <div className="border-b border-border">
                <div className="flex gap-1 p-2">
                  {[
                    { id: "orders" as const, label: "Open Orders", count: 2 },
                    { id: "history" as const, label: "Order History", count: null },
                    { id: "trades" as const, label: "Trade History", count: null },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded transition-colors",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <Badge variant="secondary" className="ml-2">
                          {tab.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === "orders" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          LIMIT BUY
                        </Badge>
                        <div>
                          <p className="font-mono font-semibold">0.5 {baseAsset}</p>
                          <p className="text-sm text-muted-foreground">@ £42,000.00</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="secondary">Open</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20">
                          STOP SELL
                        </Badge>
                        <div>
                          <p className="font-mono font-semibold">0.3 {baseAsset}</p>
                          <p className="text-sm text-muted-foreground">@ £40,000.00</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No order history yet</p>
                    <p className="text-sm mt-1">Your completed and cancelled orders will appear here</p>
                  </div>
                )}

                {activeTab === "trades" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No trade history yet</p>
                    <p className="text-sm mt-1">Your executed trades will appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Trade Form (3/12) */}
          <div className="lg:col-span-3">
            <TradeFormEnhanced
              symbol={symbol}
              currentPrice={currentPrice}
              onSubmit={(trade) => {
                console.log("Trade submitted:", trade)
                // In production, this calls your backend API
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

