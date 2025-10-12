"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PortfolioChartProps {
  data: {
    date: string
    value: number
  }[]
  totalValue: number
  change24h: number
  changePercent: number
}

export function PortfolioChart({ data, totalValue, change24h, changePercent }: PortfolioChartProps) {
  // Simple sparkline chart
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d.value - minValue) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-3xl font-bold font-mono">
            £{totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            changePercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(changePercent).toFixed(2)}%
          </div>
        </div>
        <div className={`text-sm ${change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change24h >= 0 ? '+' : ''}£{change24h.toFixed(2)} today
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="relative h-32 mb-4">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Area gradient */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={changePercent >= 0 ? "#16a34a" : "#dc2626"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={changePercent >= 0 ? "#16a34a" : "#dc2626"} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area under line */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#gradient)"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={changePercent >= 0 ? "#16a34a" : "#dc2626"}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>24h</span>
        <span>12h</span>
        <span>Now</span>
      </div>
    </Card>
  )
}
