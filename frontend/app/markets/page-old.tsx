"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { PriceDisplay } from "@/components/ui/price-display"
import { Search, Star, TrendingUp } from "lucide-react"
import { useWebSocket } from "@/lib/websocket"

interface Market {
  symbol: string
  baseAsset: string
  quoteAsset: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set())
  const [marketData, setMarketData] = React.useState<Market[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Fetch REAL markets from CoinGecko
  React.useEffect(() => {
    async function fetchMarkets() {
      try {
        const { coinGeckoService } = await import("@/lib/coingecko")
        
        // Fetch real market data from CoinGecko
        const coins = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'ripple', 'polkadot', 'avalanche-2', 'chainlink', 'uniswap']
        const cgMarkets = await coinGeckoService.getMarkets('gbp', coins)
        
        // Transform to our format
        const markets = cgMarkets.map((coin: any) => ({
          symbol: `${coin.symbol.toUpperCase()}-GBP`,
          baseAsset: coin.symbol.toUpperCase(),
          quoteAsset: 'GBP',
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          volume24h: coin.total_volume,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
        }))
        
        setMarketData(markets)
      } catch (error) {
        console.error("Failed to fetch CoinGecko data:", error)
        
        // Fallback: Try backend API
        try {
          const { apiClient } = await import("@/lib/api/client")
          const response = await apiClient.getMarkets()
          
          const marketsWithStats = await Promise.all(
            response.markets.map(async (market: any) => {
              try {
                const ticker = await apiClient.getTicker(market.symbol)
                return {
                  symbol: market.symbol,
                  baseAsset: market.base_currency,
                  quoteAsset: market.quote_currency,
                  price: parseFloat(ticker.last_price),
                  change24h: parseFloat(ticker.price_change_percent_24h),
                  volume24h: parseFloat(ticker.volume_24h),
                  high24h: parseFloat(ticker.high_24h),
                  low24h: parseFloat(ticker.low_24h),
                }
              } catch (error) {
                return {
                  symbol: market.symbol,
                  baseAsset: market.base_currency,
                  quoteAsset: market.quote_currency,
                  price: 0,
                  change24h: 0,
                  volume24h: 0,
                  high24h: 0,
                  low24h: 0,
                }
              }
            })
          )
          
          setMarketData(marketsWithStats)
        } catch (backendError) {
          console.error("Backend API also failed:", backendError)
          // Use demo data as last resort
          setMarketData([
            {
              symbol: "BTC-GBP",
              baseAsset: "BTC",
              quoteAsset: "GBP",
              price: 43250.50,
              change24h: 2.34,
              volume24h: 125000000,
              high24h: 44100.00,
              low24h: 42800.00,
            },
          ])
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchMarkets()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarkets, 30000)
    return () => clearInterval(interval)
  }, [])

  // WebSocket disabled for now to avoid connection spam when backend is unavailable
  // TODO: Re-enable when backend WebSocket server is running
  // const { data: wsMarkets } = useWebSocket<Market[]>('markets:all')
  
  // Update market data when WebSocket sends updates
  // React.useEffect(() => {
  //   if (wsMarkets) {
  //     setMarketData(wsMarkets)
  //   }
  // }, [wsMarkets])

  // Filter markets based on search
  const filteredMarkets = marketData.filter((market) =>
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFavorite = (symbol: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol)
    } else {
      newFavorites.add(symbol)
    }
    setFavorites(newFavorites)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Markets</h1>
          <p className="text-muted-foreground">
            Live cryptocurrency prices and 24-hour statistics
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search markets (e.g., BTC, Bitcoin)..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search markets"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              All Markets
            </Button>
            <Button variant="ghost" size="sm">
              Favorites
            </Button>
            <Button variant="ghost" size="sm">
              GBP Pairs
            </Button>
          </div>
        </div>

        {/* Markets Table - Desktop */}
        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    <span className="sr-only">Favorite</span>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Market</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h Change</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h Volume</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h High</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h Low</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map((market) => (
                  <tr
                    key={market.symbol}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <button
                        onClick={() => toggleFavorite(market.symbol)}
                        className="text-muted-foreground hover:text-warning transition-colors"
                        aria-label={favorites.has(market.symbol) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            favorites.has(market.symbol) ? "fill-warning text-warning" : ""
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold">{market.baseAsset}/{market.quoteAsset}</div>
                        <div className="text-xs text-muted-foreground">{market.symbol}</div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono font-medium">
                        £{market.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <PriceDisplay
                        price={0}
                        change24h={market.change24h}
                        size="sm"
                        showTrend={true}
                        className="justify-end"
                      />
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      £{(market.volume24h / 1000000).toFixed(2)}M
                    </td>
                    <td className="p-4 text-right text-sm font-mono">
                      £{market.high24h.toLocaleString('en-GB')}
                    </td>
                    <td className="p-4 text-right text-sm font-mono">
                      £{market.low24h.toLocaleString('en-GB')}
                    </td>
                    <td className="p-4 text-right">
                      <LinkButton href={`/trade/${market.symbol}`} size="sm">
                        Trade
                      </LinkButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Markets Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredMarkets.map((market) => (
            <Card key={market.symbol} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFavorite(market.symbol)}
                    className="text-muted-foreground hover:text-warning"
                    aria-label={favorites.has(market.symbol) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        favorites.has(market.symbol) ? "fill-warning text-warning" : ""
                      }`}
                    />
                  </button>
                  <div>
                    <div className="font-semibold">{market.baseAsset}/{market.quoteAsset}</div>
                    <div className="text-xs text-muted-foreground">{market.symbol}</div>
                  </div>
                </div>
                <LinkButton href={`/trade/${market.symbol}`} size="sm">
                  Trade
                </LinkButton>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-mono font-semibold">
                    £{market.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">24h Change</span>
                  <PriceDisplay
                    price={0}
                    change24h={market.change24h}
                    size="sm"
                    showTrend={true}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">24h Volume</span>
                  <span className="text-sm">£{(market.volume24h / 1000000).toFixed(2)}M</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredMarkets.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">No markets found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search query or filters
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}

