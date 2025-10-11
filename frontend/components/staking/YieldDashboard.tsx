"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  Award,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface YieldData {
  asset: string
  stakedAmount: number
  apy: number
  dailyRewards: number
  totalEarned: number
  daysStaked: number
}

export interface YieldDashboardProps {
  yields: YieldData[]
  className?: string
}

export function YieldDashboard({ yields, className }: YieldDashboardProps) {
  const totalStaked = yields.reduce((sum, y) => sum + y.stakedAmount, 0)
  const totalEarned = yields.reduce((sum, y) => sum + y.totalEarned, 0)
  const averageAPY = yields.length > 0 
    ? yields.reduce((sum, y) => sum + y.apy, 0) / yields.length
    : 0

  // Generate chart data for last 30 days
  const chartData = React.useMemo(() => {
    const days = 30
    const data = []
    const today = new Date()
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const earnings = yields.reduce((sum, y) => {
        const dailyEarning = y.dailyRewards
        return sum + dailyEarning
      }, 0)
      
      data.push({
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        earnings: earnings * (days - i), // Cumulative
      })
    }
    
    return data
  }, [yields])

  const maxEarnings = Math.max(...chartData.map(d => d.earnings))

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm">Total Value Staked</p>
          </div>
          <p className="text-3xl font-bold font-mono">
            £{(totalStaked * 2000).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-success mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +12.5% this month
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Award className="h-4 w-4" />
            <p className="text-sm">Total Rewards Earned</p>
          </div>
          <p className="text-3xl font-bold font-mono text-success">
            £{(totalEarned * 2000).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All time earnings
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="h-4 w-4" />
            <p className="text-sm">Average APY</p>
          </div>
          <p className="text-3xl font-bold text-primary">
            {averageAPY.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Across {yields.length} pools
          </p>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold font-display">Cumulative Earnings (30 Days)</h3>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <TrendingUp className="h-3 w-3 mr-1" />
            Growing
          </Badge>
        </div>

        {/* Simple bar chart */}
        <div className="space-y-2">
          {chartData.filter((_, i) => i % 3 === 0).map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-muted-foreground w-16">
                {day.date}
              </span>
              <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success to-primary rounded-lg transition-all"
                  style={{ width: `${(day.earnings / maxEarnings) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold w-20 text-right">
                £{(day.earnings * 2000).toFixed(2)}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Active Stakes Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 font-display">Your Active Stakes</h3>
        <div className="space-y-3">
          {yields.map((yield_data, index) => (
            <motion.div
              key={yield_data.asset}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold">{yield_data.asset[0]}</span>
                </div>
                <div>
                  <p className="font-semibold">{yield_data.asset}</p>
                  <p className="text-sm text-muted-foreground">
                    {yield_data.daysStaked} days staked
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">Staked</p>
                  <p className="font-mono font-semibold">
                    {yield_data.stakedAmount.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">APY</p>
                  <p className="font-bold text-primary">{yield_data.apy}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="font-mono font-semibold text-success">
                    +{yield_data.totalEarned.toFixed(4)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {yields.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active stakes</p>
              <p className="text-sm mt-1">Start staking to see your yield performance</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}






