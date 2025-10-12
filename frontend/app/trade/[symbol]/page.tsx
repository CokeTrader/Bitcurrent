"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { OrderBookEnhanced } from "@/components/trading/OrderBookEnhanced"
import { TradeFormEnhanced } from "@/components/trading/TradeFormEnhanced"
import { AdvancedChart } from "@/components/trading/AdvancedChart"
import { RealTimePrice } from "@/components/trading/RealTimePrice"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AssetIcon } from "@/components/ui/asset-icon"
import { useCoinPrice } from "@/hooks/use-market-data"
import { useWebSocketPrice } from "@/hooks/use-websocket-price"
import { 
  Star, 
  Bell,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TradePageProps {
  params: {
    symbol: string
  }
}

export default function TradePagePro({ params }: TradePageProps) {
  const router = useRouter()
  const { symbol } = params
  const [baseAsset, quoteAsset] = symbol.split("-")
  const [isFavorite, setIsFavorite] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"open" | "history" | "trades">("open")
  const [orderFormPrice, setOrderFormPrice] = React.useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)
  
  // Check authentication on mount
  React.useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const hasCookie = document.cookie.includes('session_token')
        const hasToken = localStorage.getItem('token') !== null
        setIsAuthenticated(hasCookie || hasToken)
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])
  
  // Import trading store for balance and order management
  const [tradingStore, setTradingStore] = React.useState<any>(null)
  
  React.useEffect(() => {
    import('@/lib/stores/trading-store').then(({ useTradingStore }) => {
      setTradingStore(useTradingStore.getState())
    })
  }, [])

  // Get real-time price
  const coinIdMap: Record<string, string> = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "ADA": "cardano",
  }
  
  const coinId = coinIdMap[baseAsset] || "bitcoin"
  const { data: apiPrice } = useCoinPrice(coinId, 'gbp')
  const { priceData: wsPrice, isConnected } = useWebSocketPrice(symbol)

  // Use WebSocket if available, otherwise API
  const currentPrice = wsPrice?.price || (apiPrice as any)?.[coinId]?.gbp || null
  const change24h = wsPrice?.change24h || (apiPrice as any)?.[coinId]?.gbp_24h_change || 0
  const volume24h = wsPrice?.volume24h || 0

  // Calculate 24h stats
  const stats = React.useMemo(() => {
    if (!currentPrice) return null
    return {
      high24h: currentPrice * (1 + Math.abs(change24h) / 200),
      low24h: currentPrice * (1 - Math.abs(change24h) / 200),
      volume24h: volume24h || currentPrice * 50000 * (Math.random() + 0.5),
    }
  }, [currentPrice, change24h, volume24h])

  // Get open orders from trading store
  const [openOrders, setOpenOrders] = React.useState<any[]>([])
  
  React.useEffect(() => {
    if (tradingStore) {
      setOpenOrders(tradingStore.openOrders.filter((o: any) => o.symbol === symbol))
    }
  }, [tradingStore, symbol])

  // Show login prompt if not authenticated
  if (!isCheckingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the trading platform
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/auth/register')}
              >
                Create Account
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Loading state while fetching price
  if (!currentPrice || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="h-16 w-16 skeleton rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium">Loading {baseAsset} market data...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Connecting to real-time price feeds
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Market Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Star 
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isFavorite ? "fill-warning text-warning" : "text-muted-foreground"
                  )}
                />
              </motion.button>
              
              <div className="flex items-center gap-3">
                <AssetIcon symbol={baseAsset} size="xl" />
                <div>
                  <h1 className="text-2xl font-bold font-display">{symbol}</h1>
                  <p className="text-sm text-muted-foreground">{baseAsset} / {quoteAsset}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                Set Alert
              </Button>
            </div>

            {/* Real-Time Price Display */}
            <RealTimePrice symbol={symbol} size="xl" showChange showStatus />
            
            {/* 24h Stats */}
            {stats && (
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">24h High</p>
                  <p className="font-mono font-semibold text-success">
                    £{stats.high24h.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">24h Low</p>
                  <p className="font-mono font-semibold text-danger">
                    £{stats.low24h.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">24h Volume</p>
                  <p className="font-mono font-semibold">
                    £{(stats.volume24h / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Trading Interface - Professional 3-Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Order Book (3/12) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <OrderBookEnhanced
              symbol={symbol}
              onPriceClick={(price) => {
                setOrderFormPrice(price)
                // Scroll to order form on mobile
                if (window.innerWidth < 1024) {
                  document.getElementById('trade-form')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            />
          </motion.div>

          {/* Center Column - Chart + Orders (6/12) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-6 space-y-6"
          >
            {/* Advanced Trading Chart */}
            <AdvancedChart
              symbol={symbol}
              interval="1h"
              className="h-[600px]"
            />

            {/* Order Management Tabs */}
            <Card>
              <div className="border-b border-border">
                <div className="flex gap-1 p-2">
                  {[
                    { id: "open" as const, label: "Open Orders", count: openOrders.length },
                    { id: "history" as const, label: "Order History", count: 0 },
                    { id: "trades" as const, label: "Trade History", count: 0 },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded transition-all",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-background">
                          {tab.count}
                        </Badge>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="p-6 min-h-[200px]">
                {activeTab === "open" && openOrders.length > 0 && (
                  <div className="space-y-3">
                    {openOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              order.side === "BUY" 
                                ? "bg-success/10 text-success border-success/20" 
                                : "bg-danger/10 text-danger border-danger/20"
                            )}
                          >
                            {order.type} {order.side}
                          </Badge>
                          <div>
                            <p className="font-mono font-semibold">
                              {order.amount} {baseAsset}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @ £{order.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="secondary" className="capitalize">
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-danger hover:text-danger">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === "open" && openOrders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No open orders</p>
                    <p className="text-sm mt-1">Place an order to get started</p>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No order history yet</p>
                    <p className="text-sm mt-1">Your completed and cancelled orders will appear here</p>
                  </div>
                )}

                {activeTab === "trades" && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No trade history yet</p>
                    <p className="text-sm mt-1">Your executed trades will appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Trade Form (3/12) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
            id="trade-form"
          >
            <TradeFormEnhanced
              symbol={symbol}
              currentPrice={currentPrice}
              balance={{
                base: tradingStore?.getBalance(baseAsset) || 0.00,
                quote: tradingStore?.getBalance('GBP') || 0.00
              }}
              onSubmit={async (trade) => {
                console.log("Trade submitted:", trade)
                
                // Import trading store dynamically
                const { useTradingStore } = await import('@/lib/stores/trading-store')
                const store = useTradingStore.getState()
                
                // Create order (convert stop to limit for now)
                const orderType = trade.type === 'stop' ? 'limit' : trade.type
                const order = {
                  id: `order-${Date.now()}`,
                  symbol: symbol,
                  side: trade.side,
                  type: orderType as 'market' | 'limit',
                  price: trade.price || currentPrice,
                  quantity: trade.amount,
                  filled: 0,
                  status: 'open' as const,
                  created_at: Date.now()
                }
                
                // Add to store
                store.addOrder(order)
                
                // For market orders, fill immediately (simulation)
                if (trade.type === 'market') {
                  setTimeout(() => {
                    store.fillOrder(order.id, currentPrice, order.quantity)
                    
                    // Use toast instead of alert
                    import('sonner').then(({ toast }) => {
                      toast.success(`${trade.side.toUpperCase()} order filled!`, {
                        description: `${order.quantity} ${baseAsset} at £${currentPrice.toFixed(2)}`
                      })
                    })
                  }, 1000)
                } else {
                  // Limit order - stays open
                  import('sonner').then(({ toast }) => {
                    toast.success(`${trade.side.toUpperCase()} limit order placed!`, {
                      description: `${order.quantity} ${baseAsset} at £${order.price.toFixed(2)}`
                    })
                  })
                }
                
                // Refresh the component
                setTradingStore(store)
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

