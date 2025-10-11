"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

// Register ChartJS components
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  )
}

export interface PortfolioChartProps {
  data?: {
    timestamp: number
    value: number
  }[]
  period?: "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"
  onPeriodChange?: (period: string) => void
}

const periods = ["1D", "1W", "1M", "3M", "1Y", "ALL"]

// Generate data for EMPTY account - flat line at £0.00
// In production, this would fetch real portfolio history from API
const generateSampleData = (days: number) => {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const portfolioValue = 0.00 // NEW accounts start at £0.00
  
  return Array.from({ length: days }, (_, i) => {
    const timestamp = now - (days - i) * dayMs
    // Flat line at £0.00 for empty accounts
    // Will show real data once user deposits/trades
    return { timestamp, value: portfolioValue }
  })
}

export function PortfolioChart({
  data,
  period = "1M",
  onPeriodChange,
}: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState(period)
  
  // Use provided data or generate sample
  const chartData = data || generateSampleData(30)

  const isPositive = chartData[chartData.length - 1]?.value > chartData[0]?.value

  const chartConfig = {
    labels: chartData.map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: "Portfolio Value",
        data: chartData.map(d => d.value),
        borderColor: isPositive ? "#00D395" : "#FF3B69",
        backgroundColor: isPositive
          ? "rgba(0, 211, 149, 0.1)"
          : "rgba(255, 59, 105, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? "#00D395" : "#FF3B69",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: isPositive ? "#00D395" : "#FF3B69",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `£${context.parsed.y.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: any) => {
            // For empty accounts (value = 0), just show £0
            if (value === 0) return '£0'
            // For larger values, show in k format
            if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`
            return `£${value.toFixed(0)}`
          },
        },
        suggestedMin: 0, // Always start from 0
        suggestedMax: chartData.every(d => d.value === 0) ? 100 : undefined, // Show 0-100 range for empty accounts
      },
    },
  }

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod as any)
    onPeriodChange?.(newPeriod)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Portfolio Performance</h3>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {periods.map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "h-7 px-3 text-xs",
                selectedPeriod === p && "bg-background shadow-sm"
              )}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="h-[300px]">
        {typeof window !== 'undefined' && (
          <Line data={chartConfig} options={options} />
        )}
      </div>
    </Card>
  )
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ")
}


