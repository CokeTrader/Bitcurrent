"use client"

import * as React from "react"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { AssetsTable } from "@/components/dashboard/assets-table"
import { SecurityScore } from "@/components/dashboard/security-score"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Wallet, 
  Download,
  RefreshCw,
  Plus,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

// Portfolio Insights Component
function PortfolioInsights() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Portfolio Insights
      </h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
          <div className="text-2xl">💡</div>
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Diversification Opportunity</p>
            <p className="text-muted-foreground">
              Your portfolio is 75% in Bitcoin. Consider diversifying into ETH or stablecoins to reduce volatility.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="text-2xl">📈</div>
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Staking Opportunity</p>
            <p className="text-muted-foreground">
              Your 2.5 ETH could earn ~£215/year through staking (5.2% APY). <Link href="/staking" className="text-primary hover:underline font-semibold">Start earning →</Link>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Risk Alert</p>
            <p className="text-muted-foreground">
              Portfolio volatility is HIGH (80th percentile). Consider adding USDT or USDC for stability.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Quick Actions Component
function QuickActions() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <Link href="/trade/BTC-GBP">
          <Button variant="default" className="w-full justify-between" size="lg">
            <span>Buy Crypto</span>
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
        
        <Link href="/recurring-buy">
          <Button variant="outline" className="w-full justify-between">
            <span>Set Up Recurring Buy</span>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </Link>

        <Link href="/staking">
          <Button variant="outline" className="w-full justify-between">
            <span>Enable Staking</span>
            <TrendingUp className="h-4 w-4" />
          </Button>
        </Link>

        <Link href="/referrals">
          <Button variant="ghost" className="w-full justify-between">
            <span>Invite Friends</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// Market News Component
function MarketNews() {
  const news = [
    {
      title: "BTC breaks £42,000",
      time: "2 hours ago",
      sentiment: "positive"
    },
    {
      title: "Ethereum upgrade scheduled",
      time: "5 hours ago",
      sentiment: "positive"
    },
    {
      title: "Solana network congestion",
      time: "1 day ago",
      sentiment: "neutral"
    }
  ]

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Market News</h3>
      <div className="space-y-3">
        {news.map((item, i) => (
          <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className={`text-lg ${
              item.sentiment === 'positive' ? '🟢' : 
              item.sentiment === 'negative' ? '🔴' : '⚪'
            }`}>
              {item.sentiment === 'positive' ? '🟢' : 
               item.sentiment === 'negative' ? '🔴' : '⚪'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="w-full mt-4">
        View All News →
      </Button>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your portfolio overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/deposit">
              <Button size="lg">
                <Wallet className="h-4 w-4" />
                Deposit Funds
              </Button>
            </Link>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <PortfolioOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Assets (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Performance Chart */}
            <PortfolioChart />

            {/* Assets Table */}
            <AssetsTable />
          </div>

          {/* Right Column - Sidebar Widgets (1/3 width on desktop) */}
          <div className="space-y-6">
            {/* Security Score */}
            <SecurityScore />

            {/* Portfolio Insights */}
            <PortfolioInsights />

            {/* Quick Actions */}
            <QuickActions />

            {/* Market News */}
            <MarketNews />
          </div>
        </div>
      </div>
    </div>
  )
}

