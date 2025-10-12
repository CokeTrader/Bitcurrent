"use client"

import { Card } from "./card"
import { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ 
  label, 
  value, 
  change, 
  changeLabel,
  icon: Icon,
  trend = "neutral"
}: StatCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-green-600"
      case "down": return "text-red-600"
      default: return "text-muted-foreground"
    }
  }

  return (
    <Card className="p-6">
      {Icon && (
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
          {trend === "up" && <TrendingUp className="h-4 w-4" />}
          {trend === "down" && <TrendingDown className="h-4 w-4" />}
          <span>{change > 0 ? '+' : ''}{change}%</span>
          {changeLabel && <span className="text-muted-foreground font-normal ml-1">{changeLabel}</span>}
        </div>
      )}
    </Card>
  )
}
