"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Gift, Award } from "lucide-react"

interface Activity {
  id: string
  type: "trade" | "deposit" | "withdrawal" | "bonus" | "staking"
  description: string
  amount?: number
  symbol?: string
  timestamp: string
  status: "success" | "pending" | "failed"
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const activities: Activity[] = [
    {
      id: "1",
      type: "trade",
      description: "Bought 0.01 BTC",
      amount: 600,
      symbol: "BTC",
      timestamp: "2 hours ago",
      status: "success"
    },
    {
      id: "2",
      type: "deposit",
      description: "Deposited via Stripe",
      amount: 1000,
      timestamp: "5 hours ago",
      status: "success"
    },
    {
      id: "3",
      type: "bonus",
      description: "£10 signup bonus credited",
      amount: 10,
      timestamp: "1 day ago",
      status: "success"
    },
    {
      id: "4",
      type: "staking",
      description: "Staking rewards earned",
      amount: 2.50,
      symbol: "ETH",
      timestamp: "2 days ago",
      status: "success"
    }
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "trade":
        return TrendingUp
      case "deposit":
        return ArrowDownCircle
      case "withdrawal":
        return ArrowUpCircle
      case "bonus":
        return Gift
      case "staking":
        return Award
      default:
        return TrendingUp
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case "trade":
        return "text-blue-600"
      case "deposit":
        return "text-green-600"
      case "withdrawal":
        return "text-orange-600"
      case "bonus":
        return "text-purple-600"
      case "staking":
        return "text-emerald-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.slice(0, limit).map((activity) => {
          const Icon = getIcon(activity.type)
          const color = getColor(activity.type)
          
          return (
            <div key={activity.id} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
              
              <div className="text-right">
                {activity.amount && (
                  <div className={`font-semibold font-mono ${
                    activity.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {activity.type === 'withdrawal' ? '-' : '+'}£{activity.amount.toFixed(2)}
                  </div>
                )}
                {activity.status === 'pending' && (
                  <Badge variant="secondary" className="text-xs">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activity</p>
        </div>
      )}
    </Card>
  )
}

