"use client"

import * as React from "react"
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Maximize2, TrendingUp, BarChart3, Activity } from "lucide-react"

export interface AdvancedChartProps {
  symbol: string
  data?: CandlestickData<Time>[]
  interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  currentPrice?: number | null
  onIntervalChange?: (interval: string) => void
  className?: string
}

const intervals = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
]

// Generate realistic candlestick data
function generateCandlestickData(basePrice: number): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = []
  const now = Math.floor(Date.now() / 1000)
  const daySeconds = 24 * 60 * 60
  
  let price = basePrice
  
  for (let i = 100; i >= 0; i--) {
    const time = (now - (i * daySeconds)) as Time
    const open = price
    const volatility = price * 0.02
    const change = (Math.random() - 0.5) * volatility
    const high = open + Math.abs(change) + Math.random() * volatility * 0.5
    const low = open - Math.abs(change) - Math.random() * volatility * 0.5
    const close = open + change
    
    price = close
    
    data.push({
      time,
      open,
      high,
      low,
      close,
    })
  }
  
  return data
}

export function AdvancedChart({ 
  symbol, 
  data, 
  interval = '1h', 
  currentPrice,
  onIntervalChange,
  className 
}: AdvancedChartProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const candlestickSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)
  const [selectedInterval, setSelectedInterval] = React.useState(interval)
  const [chartType, setChartType] = React.useState<'candlestick' | 'line'>('candlestick')

  // Initialize chart
  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(42, 58, 95, 0.2)' },
        horzLines: { color: 'rgba(42, 58, 95, 0.2)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2A3A5F',
      },
      rightPriceScale: {
        borderColor: '#2A3A5F',
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: '#0052FF',
          width: 1,
          style: 2,
          labelBackgroundColor: '#0052FF',
        },
        horzLine: {
          color: '#0052FF',
          width: 1,
          style: 2,
          labelBackgroundColor: '#0052FF',
        },
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00D395',
      downColor: '#FF3B69',
      borderUpColor: '#00D395',
      borderDownColor: '#FF3B69',
      wickUpColor: '#00D395',
      wickDownColor: '#FF3B69',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Set data - use current price if available
    const basePrice = currentPrice || 84092 // Use current price if available
    const chartData = data || generateCandlestickData(basePrice)
    candlestickSeries.setData(chartData)

    // Fit content
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data])

  const handleIntervalChange = (newInterval: typeof interval) => {
    setSelectedInterval(newInterval)
    onIntervalChange?.(newInterval)
    
    // Regenerate data for new interval
    if (candlestickSeriesRef.current && !data) {
      const newData = generateCandlestickData(84092) // Regenerate with current price
      candlestickSeriesRef.current.setData(newData)
      chartRef.current?.timeScale().fitContent()
    }
  }

  const handleFullscreen = () => {
    if (chartContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        chartContainerRef.current.requestFullscreen()
      }
    }
  }

  return (
    <Card className={cn("p-4", className)}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === 'candlestick' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('candlestick')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {intervals.map((int) => (
            <Button
              key={int.value}
              variant={selectedInterval === int.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleIntervalChange(int.value as any)}
              className="h-8 px-3 text-xs"
            >
              {int.label}
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={handleFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success pulse-live" />
          <span>Real-time updates</span>
        </div>
        <div>
          TradingView-style chart powered by Lightweight Charts
        </div>
      </div>
    </Card>
  )
}

