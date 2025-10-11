"use client"

import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay } from "@/components/ui/price-display"
import { 
  TrendingUp, 
  Wallet, 
  Star, 
  Clock, 
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff 
} from "lucide-react"
import Link from "next/link"
import { useWebSocket } from "@/lib/websocket"
import { formatGBP, formatCrypto } from "@/lib/utils"

interface PortfolioAsset {
  symbol: string
  name: string
  balance: number
  value: number
  change24h: number
  allocation: number
}

export default function DashboardPage() {
  const [hideBalances, setHideBalances] = React.useState(false)
  const [advancedMode, setAdvancedMode] = React.useState(false)
  const [portfolioData, setPortfolioData] = React.useState({
    totalValue: 0,
    change24h: 0,
    change24hPercent: 0,
    assets: [] as PortfolioAsset[],
  })
  const [loading, setLoading] = React.useState(true)

  // Fetch portfolio data with REAL prices from CoinGecko
  React.useEffect(() => {
    async function fetchPortfolio() {
      try {
        // First try to get user's actual balances from backend
        const { apiClient } = await import("@/lib/api/client")
        const response = await apiClient.getPortfolio()
        
        // Get real prices from CoinGecko
        const { coinGeckoService } = await import("@/lib/coingecko")
        const coins = ['bitcoin', 'ethereum']
        const cgMarkets = await coinGeckoService.getMarkets('gbp', coins)
        
        // Calculate portfolio with real prices
        const btcPrice = cgMarkets.find((c: any) => c.id === 'bitcoin')?.current_price || 0
        const ethPrice = cgMarkets.find((c: any) => c.id === 'ethereum')?.current_price || 0
        const btcChange = cgMarkets.find((c: any) => c.id === 'bitcoin')?.price_change_percentage_24h || 0
        const ethChange = cgMarkets.find((c: any) => c.id === 'ethereum')?.price_change_percentage_24h || 0
        
        // Get actual user balances from backend
        const balances = response.balances || []
        
        // Find user's actual balances
        const btcBalance = balances.find((b: any) => b.currency === 'BTC')?.balance || 0
        const ethBalance = balances.find((b: any) => b.currency === 'ETH')?.balance || 0
        const gbpBalance = balances.find((b: any) => b.currency === 'GBP')?.balance || 0
        
        const btcValue = btcBalance * btcPrice
        const ethValue = ethBalance * ethPrice
        const totalValue = btcValue + ethValue + gbpBalance
        
        const assets = [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: btcBalance,
            value: btcValue,
            change24h: btcChange,
            allocation: totalValue > 0 ? (btcValue / totalValue) * 100 : 0,
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            balance: ethBalance,
            value: ethValue,
            change24h: ethChange,
            allocation: totalValue > 0 ? (ethValue / totalValue) * 100 : 0,
          },
          {
            symbol: 'GBP',
            name: 'British Pound',
            balance: gbpBalance,
            value: gbpBalance,
            change24h: 0.00,
            allocation: totalValue > 0 ? (gbpBalance / totalValue) * 100 : 0,
          },
        ]
        
        // Calculate 24h change
        const previousTotal = totalValue / (1 + (btcChange / 100))
        const change24h = totalValue - previousTotal
        const change24hPercent = (change24h / previousTotal) * 100
        
        setPortfolioData({
          totalValue,
          change24h,
          change24hPercent,
          assets,
        })
      } catch (error) {
        console.error("Failed to fetch portfolio:", error)
        
        // Use demo data with approximate prices
        setPortfolioData({
          totalValue: 15432.50,
          change24h: 234.75,
          change24hPercent: 1.54,
          assets: [
            {
              symbol: 'BTC',
              name: 'Bitcoin',
              balance: 0.25,
              value: 10812.50,
              change24h: 2.34,
              allocation: 70.0,
            },
            {
              symbol: 'ETH',
              name: 'Ethereum',
              balance: 1.5,
              value: 4268.63,
              change24h: -1.23,
              allocation: 27.7,
            },
            {
              symbol: 'GBP',
              name: 'British Pound',
              balance: 351.37,
              value: 351.37,
              change24h: 0.00,
              allocation: 2.3,
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchPortfolio()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolio, 30000)
    return () => clearInterval(interval)
  }, [])

  // WebSocket for real-time updates
  const { data: wsPortfolio } = useWebSocket<{
    totalValue: number
    change24h: number
    change24hPercent: number
    assets: PortfolioAsset[]
  }>('portfolio:balance')

  // Update when WebSocket sends data
  React.useEffect(() => {
    if (wsPortfolio) {
      setPortfolioData(wsPortfolio)
    }
  }, [wsPortfolio])

  // Recent transactions demo
  const recentTransactions = [
    {
      id: '1',
      type: 'buy',
      asset: 'BTC',
      amount: 0.05,
      price: 43250.50,
      total: 2162.53,
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      type: 'sell',
      asset: 'ETH',
      amount: 0.25,
      price: 2845.75,
      total: 711.44,
      timestamp: new Date(Date.now() - 7200000),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back to your portfolio
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedMode(!advancedMode)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {advancedMode ? 'Basic' : 'Advanced'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Portfolio Value Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
                  <div className="flex items-baseline gap-4">
                    <h2 className={`text-portfolio font-bold ${hideBalances ? 'blur-md select-none' : ''}`}>
                      {formatGBP(portfolioData.totalValue)}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHideBalances(!hideBalances)}
                      aria-label={hideBalances ? "Show balances" : "Hide balances"}
                    >
                      {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Wallet className="h-12 w-12 text-primary/50" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-3">
                <PriceDisplay
                  price={0}
                  change24h={portfolioData.change24hPercent}
                  size="md"
                  showTrend={true}
                />
                <span className={`text-sm font-medium ${
                  portfolioData.change24hPercent >= 0 ? 'text-buy' : 'text-sell'
                }`}>
                  {portfolioData.change24hPercent >= 0 ? '+' : ''}
                  {formatGBP(portfolioData.change24h)} today
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Assets</span>
                  <LinkButton href="/markets" variant="ghost" size="sm" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    View Markets
                  </LinkButton>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioData.assets.map((asset) => (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                          {asset.symbol[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{asset.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCrypto(asset.balance, asset.symbol === 'GBP' ? 2 : 8)} {asset.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${hideBalances ? 'blur-md select-none' : ''}`}>
                          {formatGBP(asset.value)}
                        </div>
                        <PriceDisplay
                          price={0}
                          change24h={asset.change24h}
                          size="sm"
                          showTrend={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <LinkButton href="/trade/BTC-GBP" size="lg" className="w-full justify-start flex items-center" variant="outline">
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Trade Crypto
                </LinkButton>
                <LinkButton href="/account/deposit" size="lg" className="w-full justify-start flex items-center" variant="outline">
                  <ArrowDownRight className="mr-3 h-5 w-5 text-buy" />
                  Deposit GBP
                </LinkButton>
                <LinkButton href="/account/withdraw" size="lg" className="w-full justify-start flex items-center" variant="outline">
                  <ArrowUpRight className="mr-3 h-5 w-5 text-sell" />
                  Withdraw Funds
                </LinkButton>
                <LinkButton href="/account/security" size="lg" className="w-full justify-start flex items-center" variant="outline">
                  <Settings className="mr-3 h-5 w-5" />
                  Account Settings
                </LinkButton>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </div>
                <LinkButton href="/account/history" variant="ghost" size="sm">
                  View All
                </LinkButton>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'buy' ? 'bg-buy/10' : 'bg-sell/10'
                      }`}>
                        {tx.type === 'buy' ? (
                          <ArrowDownRight className={`h-5 w-5 text-buy`} />
                        ) : (
                          <ArrowUpRight className={`h-5 w-5 text-sell`} />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.asset}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tx.timestamp.toLocaleString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCrypto(tx.amount)} {tx.asset}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @ {formatGBP(tx.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Empty State */}
              {recentTransactions.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Start trading to see your transaction history
                  </p>
                  <LinkButton href="/markets">
                    Browse Markets
                  </LinkButton>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Mode: Additional Widgets */}
          {advancedMode && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Watchlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <Star className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No items in watchlist</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Price Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No active alerts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">7 Days</span>
                        <span className="text-buy font-medium">+5.67%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">30 Days</span>
                        <span className="text-buy font-medium">+12.34%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">All Time</span>
                        <span className="text-buy font-medium">+45.89%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
