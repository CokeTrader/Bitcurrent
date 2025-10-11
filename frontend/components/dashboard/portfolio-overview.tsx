"use client"

import * as React from "react"
import { StatCard } from "@/components/ui/stat-card"
import { TrendingUp, Wallet, Activity, Award } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface PortfolioData {
  totalValue: number
  change24h: number
  changePercentage24h: number
  btcValue: number
  bestPerformer: {
    symbol: string
    change: number
  }
  totalTrades: number
}

// Simulated API call - will be replaced with real backend
async function fetchPortfolioData(): Promise<PortfolioData> {
  // In production, this calls your backend API
  // For now, returning realistic sample data
  return {
    totalValue: 24582.45,
    change24h: 1234.56,
    changePercentage24h: 5.28,
    btcValue: 0.58247,
    bestPerformer: {
      symbol: "BTC",
      change: 12.4
    },
    totalTrades: 1247
  }
}

export function PortfolioOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-overview'],
    queryFn: fetchPortfolioData,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Portfolio Value"
        value={`£${data?.totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
        subtitle={`≈ ${data?.btcValue.toFixed(8) || '0.00000000'} BTC`}
        change={{
          value: data?.changePercentage24h || 0,
          type: "percentage"
        }}
        icon={Wallet}
        trend={data && data.change24h > 0 ? "up" : "down"}
        variant="primary"
        loading={isLoading}
      />

      <StatCard
        title="24h Change"
        value={data ? `£${Math.abs(data.change24h).toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '£0.00'}
        change={{
          value: data?.changePercentage24h || 0,
          type: "percentage"
        }}
        icon={TrendingUp}
        trend={data && data.change24h > 0 ? "up" : "down"}
        variant={data && data.change24h > 0 ? "success" : "danger"}
        loading={isLoading}
      />

      <StatCard
        title="Best Performer"
        value={data?.bestPerformer.symbol || "—"}
        subtitle={`+${data?.bestPerformer.change.toFixed(2) || 0}% today`}
        icon={Award}
        trend="up"
        loading={isLoading}
      />

      <StatCard
        title="Total Trades"
        value={data?.totalTrades.toLocaleString('en-GB') || '0'}
        subtitle="All time"
        icon={Activity}
        loading={isLoading}
      />
    </div>
  )
}







