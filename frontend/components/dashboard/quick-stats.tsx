"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, Award } from "lucide-react"

interface QuickStatsProps {
  totalValue: number
  change24h: number
  changePercent: number
  totalTrades: number
  totalFees: number
  winRate: number
}

export function QuickStats({ 
  totalValue, 
  change24h, 
  changePercent,
  totalTrades,
  totalFees,
  winRate
}: QuickStatsProps) {
  const stats = [
    {
      label: "Portfolio Value",
      value: `£${totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
      change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      changeValue: `${change24h >= 0 ? '+' : ''}£${Math.abs(change24h).toFixed(2)}`,
      icon: DollarSign,
      positive: changePercent >= 0
    },
    {
      label: "Total Trades",
      value: totalTrades.toString(),
      change: "This month",
      icon: Activity,
      positive: true
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      change: totalTrades > 0 ? "Above average" : "No trades yet",
      icon: Award,
      positive: winRate > 50
    },
    {
      label: "Total Fees",
      value: `£${totalFees.toFixed(2)}`,
      change: "All time",
      icon: PieChart,
      positive: false
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              stat.positive ? 'bg-green-100 dark:bg-green-950' : 'bg-muted'
            }`}>
              <stat.icon className={`h-5 w-5 ${
                stat.positive ? 'text-green-600' : 'text-muted-foreground'
              }`} />
            </div>
            {stat.changeValue && (
              <div className={`text-sm font-semibold ${
                stat.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeValue}
              </div>
            )}
          </div>
          
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
          
          <div className={`text-xs flex items-center gap-1 ${
            stat.positive ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            {stat.positive && <TrendingUp className="h-3 w-3" />}
            {stat.change}
          </div>
        </Card>
      ))}
    </div>
  )
}


