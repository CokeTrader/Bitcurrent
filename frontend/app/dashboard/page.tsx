"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useAccount } from 'wagmi'
import { WalletConnect } from "@/components/web3/WalletConnect"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AssetsTable } from "@/components/dashboard/assets-table"
import { SecurityScore } from "@/components/dashboard/security-score"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { RewardsWidget } from "@/components/staking/RewardsWidget"
import { YieldDashboard } from "@/components/staking/YieldDashboard"
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Sparkles,
  Award,
  Wallet,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { OnboardingTour } from "@/components/onboarding/OnboardingTour"

export default function DashboardPagePro() {
  const { address, isConnected } = useAccount()
  const [portfolioValue, setPortfolioValue] = React.useState(0.00)
  const [todayChange] = React.useState(0.00)
  const [changePercent] = React.useState(0.00)
  const isPositive = changePercent >= 0
  const [showTour, setShowTour] = React.useState(false)

  // Check if this is a new user (first time on dashboard)
  React.useEffect(() => {
    // Only show tour for truly new users (no trading history, no deposits)
    const hasSeenTour = localStorage.getItem('hasSeenTour')
    const hasTradingHistory = localStorage.getItem('hasTradingHistory')
    const hasDeposits = localStorage.getItem('hasDeposits')
    
    // Show tour only if:
    // 1. Never seen tour before AND
    // 2. No trading history AND 
    // 3. No deposits (truly new user)
    if (!hasSeenTour && !hasTradingHistory && !hasDeposits) {
      setShowTour(true)
    }
  }, [])
  
  // Update portfolio value from trading store
  React.useEffect(() => {
    const updatePortfolio = async () => {
      const { useTradingStore } = await import('@/lib/stores/trading-store')
      const store = useTradingStore.getState()
      setPortfolioValue(store.portfolioValue)
    }
    
    updatePortfolio()
    
    // Subscribe to changes
    const interval = setInterval(updatePortfolio, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleCloseTour = () => {
    localStorage.setItem('hasSeenTour', 'true')
    setShowTour(false)
  }

  // Real rewards data - empty for new users
  const rewards: any[] = []

  // Real yield data - empty for new users
  const yields: any[] = []

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          onComplete={handleCloseTour}
          onSkip={handleCloseTour}
        />
      )}
      
      <main id="main-content" className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 font-display">Portfolio</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's your portfolio overview
              </p>
            </div>
            <div className="hidden lg:block">
              <WalletConnect variant="button" showBalance />
            </div>
          </div>

          {/* Portfolio Value - Hero */}
          <Card className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary to-success blur-3xl opacity-20" />
            
            <div className="relative">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="h-4 w-4" />
                <p className="text-sm">Total Portfolio Value</p>
              </div>
              
              <div className="flex items-baseline gap-4 mb-4">
                <motion.p
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-bold font-mono"
                >
                  £{portfolioValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </motion.p>
                
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold",
                  isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                )}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </div>
              </div>

              <p className="text-muted-foreground">
                {isPositive ? '+' : ''}£{todayChange.toLocaleString('en-GB', { minimumFractionDigits: 2 })} today
              </p>

              <div className="flex gap-3 mt-6">
                <Button size="lg" className="gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  Deposit
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Withdraw
                </Button>
                <Link href="/trade/BTC-GBP">
                  <Button size="lg" variant="outline" className="gap-2">
                    Trade Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick Stats - Empty for new accounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">24h P&L</p>
              <p className="text-2xl font-bold text-muted-foreground">£0.00</p>
              <p className="text-xs text-muted-foreground">0.00%</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-muted-foreground">0</p>
              <p className="text-xs text-muted-foreground">Start trading</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-muted-foreground">0</p>
              <p className="text-xs text-muted-foreground">All time</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
              <p className="text-2xl font-bold text-muted-foreground">£0.00</p>
              <p className="text-xs text-muted-foreground">Lifetime</p>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Chart + Assets */}
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio Chart */}
              <PortfolioChart />

              {/* Assets Table */}
              <AssetsTable />
            </div>

            {/* Right Column - Widgets */}
            <div className="space-y-6">
              {/* Security Score */}
              <SecurityScore />

              {/* Rewards Widget */}
              <RewardsWidget 
                rewards={rewards}
                onClaimAll={() => {
                  // Handle claim all
                }}
              />

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/trade/BTC-GBP">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Buy Crypto
                    </Button>
                  </Link>
                  <Link href="/staking">
                    <Button variant="outline" className="w-full justify-start">
                      <Award className="h-4 w-4 mr-2" />
                      Enable Staking
                    </Button>
                  </Link>
                  <Link href="/web3">
                    <Button variant="outline" className="w-full justify-start">
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Getting Started - NEW accounts */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">🚀 Getting Started</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="text-primary">1.</span>
                    <p className="text-muted-foreground">
                      Deposit funds to start trading
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary">2.</span>
                    <p className="text-muted-foreground">
                      Complete KYC for higher limits
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary">3.</span>
                    <p className="text-muted-foreground">
                      Enable 2FA for extra security
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Yield Dashboard (if staking) */}
          {yields.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold font-display">Yield Performance</h2>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Earning
                </Badge>
              </div>
              <YieldDashboard yields={yields} />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

