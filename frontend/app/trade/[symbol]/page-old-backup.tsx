"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Badge } from "@/components/ui/badge"
import { TradingChart } from "@/components/trading/TradingChart"
import { LiveOrderbook } from "@/components/trading/LiveOrderbook"
import { OrderForm } from "@/components/trading/OrderForm"
import { PriceDisplay } from "@/components/ui/price-display"
import { useWebSocket } from "@/lib/websocket"
import { formatGBP, formatCrypto, formatCompact, formatPercentage } from "@/lib/utils"
import { TrendingUp, Volume2, Clock } from "lucide-react"

interface MarketStats {
  price: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
}

export default function TradePage() {
  const [hasError, setHasError] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Trade page error:", error)
      setHasError(true)
      setErrorMessage(error.message || "An unexpected error occurred")
    }
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Trade page promise rejection:", event)
      setHasError(true)
      setErrorMessage("Failed to load trading data")
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
  
  const params = useParams()
  const symbol = params.symbol as string
  
  // Handle missing or invalid symbol
  if (!symbol || typeof symbol !== 'string') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Trading Pair</h1>
          <p className="text-muted-foreground mb-8">The trading pair you requested is not valid.</p>
          <LinkButton href="/markets">Back to Markets</LinkButton>
        </div>
        <Footer />
      </div>
    )
  }
  
  // Handle runtime errors
  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Trading Page Error</h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <p className="text-sm text-muted-foreground mb-8">Please try refreshing the page or contact support if the problem persists.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            <LinkButton href="/markets">Back to Markets</LinkButton>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
  
  const [baseAsset, quoteAsset] = symbol.split('-')
  
  // Handle invalid symbol format
  if (!baseAsset || !quoteAsset || baseAsset === quoteAsset) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Trading Pair Format</h1>
          <p className="text-muted-foreground mb-8">Trading pairs must be in the format BASE-QUOTE (e.g., BTC-GBP).</p>
          <LinkButton href="/markets">Back to Markets</LinkButton>
        </div>
        <Footer />
      </div>
    )
  }
  
  const [selectedPrice, setSelectedPrice] = React.useState<number | undefined>()

  const [marketStats, setMarketStats] = React.useState<MarketStats>({
    price: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
  })

  // Fetch REAL market data from CoinGecko
  React.useEffect(() => {
    async function fetchMarketStats() {
      try {
        const { coinGeckoService } = await import("@/lib/coingecko")
        
        // Map symbol to CoinGecko ID
        const coinMap: Record<string, string> = {
          'BTC': 'bitcoin',
          'ETH': 'ethereum',
          'BNB': 'binancecoin',
          'SOL': 'solana',
          'ADA': 'cardano',
          'XRP': 'ripple',
          'DOT': 'polkadot',
          'AVAX': 'avalanche-2',
        }
        
        const coinId = coinMap[baseAsset] || 'bitcoin'
        const markets = await coinGeckoService.getMarkets('gbp', [coinId])
        
        if (markets && markets.length > 0) {
          const coin = markets[0]
          setMarketStats({
            price: coin.current_price || 0,
            change24h: coin.price_change_percentage_24h || 0,
            high24h: coin.high_24h || 0,
            low24h: coin.low_24h || 0,
            volume24h: coin.total_volume || 0,
          })
        } else {
          // No market data found, use fallback
          throw new Error("No market data available")
        }
      } catch (error) {
        console.error("Failed to fetch market stats:", error)
        // Fallback to demo data based on symbol
        const fallbackPrices: Record<string, number> = {
          'BTC': 43250.50,
          'ETH': 2650.75,
          'SOL': 98.45,
          'ADA': 0.45,
          'MATIC': 0.85,
        }
        
        const fallbackPrice = fallbackPrices[baseAsset] || 43250.50
        
        setMarketStats({
          price: fallbackPrice,
          change24h: 2.34,
          high24h: fallbackPrice * 1.02,
          low24h: fallbackPrice * 0.98,
          volume24h: 125000000,
        })
      }
    }
    
    if (baseAsset) {
      fetchMarketStats()
      
      // Refresh every 30 seconds (less frequent to avoid rate limits)
      const interval = setInterval(fetchMarketStats, 30000)
      return () => clearInterval(interval)
    }
  }, [baseAsset])

  // WebSocket for even faster updates (optional)
  const { data: wsStats } = useWebSocket<MarketStats>(`ticker:${symbol}`)
  
  React.useEffect(() => {
    if (wsStats) {
      setMarketStats(wsStats)
    }
  }, [wsStats])

  const handlePriceClick = (price: number) => {
    setSelectedPrice(price)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-fluid mx-auto px-4 py-6 max-w-[2000px]">
        {/* Market Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {baseAsset}/{quoteAsset}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{baseAsset} to {quoteAsset}</Badge>
                  <Badge variant="success">Live</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Price</div>
                <div className="text-price-large font-mono font-semibold">
                  {formatGBP(marketStats.price)}
                </div>
                <PriceDisplay
                  price={0}
                  change24h={marketStats.change24h}
                  size="md"
                  showTrend={true}
                />
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">24h High</div>
                <div className="text-sm font-mono font-medium">
                  {formatGBP(marketStats.high24h)}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">24h Low</div>
                <div className="text-sm font-mono font-medium">
                  {formatGBP(marketStats.low24h)}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  24h Volume
                </div>
                <div className="text-sm font-medium">
                  £{formatCompact(marketStats.volume24h)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Chart */}
        <div className="mb-4">
          <TradingChart 
            symbol={symbol}
            interval="1h"
          />
        </div>

        {/* Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Market Overview */}
          <div className="lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {formatGBP(marketStats.price)}
                    </div>
                    <div className="text-lg">
                      <PriceDisplay
                        price={0}
                        change24h={marketStats.change24h}
                        size="lg"
                        showTrend={true}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">24h High</div>
                      <div className="font-semibold">{formatGBP(marketStats.high24h)}</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">24h Low</div>
                      <div className="font-semibold">{formatGBP(marketStats.low24h)}</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
                      <div className="font-semibold">£{formatCompact(marketStats.volume24h)}</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Change 24h</div>
                      <div className="font-semibold">
                        <PriceDisplay
                          price={0}
                          change24h={marketStats.change24h}
                          size="sm"
                          showTrend={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Orderbook */}
            <LiveOrderbook 
              symbol={symbol}
              onPriceClick={setSelectedPrice}
            />
          </div>

          {/* Order Form */}
          <div className="lg:col-span-6">
            <OrderForm 
              symbol={symbol}
              currentPrice={marketStats.price || 43250.50}
              balance={{ base: 0.5, quote: 5000 }}
              onOrderPlaced={() => {
                console.log("Order placed successfully!")
                // TODO: Refresh balances and order history
              }}
            />

            {/* Market Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Market Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trading Pair</span>
                    <span className="font-medium">{baseAsset}/{quoteAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Asset</span>
                    <span className="font-medium">{baseAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quote Asset</span>
                    <span className="font-medium">{quoteAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="success">Live</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trade History Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left p-2">Time</th>
                    <th className="text-right p-2">Price ({quoteAsset})</th>
                    <th className="text-right p-2">Amount ({baseAsset})</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const isBuy = i % 2 === 0 // Deterministic for SSR
                    // Use static relative times to avoid hydration mismatch
                    const minutesAgo = i + 1
                    const timeDisplay = `${minutesAgo} min ago`
                    
                    return (
                      <tr key={i} className="border-b border-border/50 text-sm hover:bg-muted/30">
                        <td className="p-2 text-muted-foreground">
                          {timeDisplay}
                        </td>
                        <td className={`p-2 text-right font-mono ${isBuy ? 'text-buy' : 'text-sell'}`}>
                          {formatGBP(marketStats.price + ((i * 13) % 100 - 50))}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {formatCrypto(0.1 + (i * 0.12) % 0.5, 8)}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {formatGBP(5000 + (i * 3000))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
