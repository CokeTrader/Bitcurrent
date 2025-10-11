"use client"

import * as React from "react"
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChartData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface TradingChartProps {
  symbol: string
  data?: ChartData[]
  interval?: string
  className?: string
}

export function TradingChart({ symbol, data = [], className }: TradingChartProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const candlestickSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)
  const [chartType, setChartType] = React.useState<'candlestick' | 'line'>('candlestick')
  const [timeframe, setTimeframe] = React.useState('1h')

  // Initialize chart
  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00C853',
      downColor: '#F44336',
      borderVisible: false,
      wickUpColor: '#00C853',
      wickDownColor: '#F44336',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Demo data if none provided
    const demoData = data.length > 0 ? data : generateDemoData()
    candlestickSeries.setData(demoData as any)

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

  const [showIndicators, setShowIndicators] = React.useState(false)
  const [selectedIndicators, setSelectedIndicators] = React.useState<string[]>([])

  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
    { label: '1w', value: '1w' },
    { label: '1M', value: '1M' },
  ]
  
  const indicators = [
    { label: 'Volume', value: 'volume' },
    { label: 'RSI', value: 'rsi' },
    { label: 'MACD', value: 'macd' },
    { label: 'Bollinger Bands', value: 'bb' },
    { label: 'SMA 20', value: 'sma20' },
    { label: 'EMA 50', value: 'ema50' },
  ]
  
  const toggleIndicator = (value: string) => {
    setSelectedIndicators(prev => 
      prev.includes(value) 
        ? prev.filter(i => i !== value)
        : [...prev, value]
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className="h-8 px-3"
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Chart:</span>
          <Button
            variant={chartType === 'candlestick' ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartType('candlestick')}
            className="h-8 px-3"
          >
            Candlestick
          </Button>
          <Button
            variant={chartType === 'line' ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartType('line')}
            className="h-8 px-3"
          >
            Line
          </Button>
          <Button
            variant={showIndicators ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIndicators(!showIndicators)}
            className="h-8 px-3"
          >
            Indicators ({selectedIndicators.length})
          </Button>
        </div>
      </div>
      
      {/* Indicators Menu */}
      {showIndicators && (
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Technical Indicators</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIndicators([])}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {indicators.map((ind) => (
              <Button
                key={ind.value}
                variant={selectedIndicators.includes(ind.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator(ind.value)}
                className="h-8 text-xs"
              >
                {ind.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Select indicators to overlay on the chart. Click again to remove.
          </p>
        </div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="rounded-lg border border-border bg-card"
        role="img"
        aria-label={`${symbol} price chart showing ${chartType} view on ${timeframe} timeframe`}
      />

      {/* Accessibility: Data Table Alternative */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View chart data as table (for screen readers)
        </summary>
        <div className="mt-2 max-h-40 overflow-auto border border-border rounded p-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">Time</th>
                <th className="text-right p-1">Open</th>
                <th className="text-right p-1">High</th>
                <th className="text-right p-1">Low</th>
                <th className="text-right p-1">Close</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((candle, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-1">{new Date(candle.time * 1000).toLocaleTimeString()}</td>
                  <td className="text-right p-1">{candle.open.toFixed(2)}</td>
                  <td className="text-right p-1">{candle.high.toFixed(2)}</td>
                  <td className="text-right p-1">{candle.low.toFixed(2)}</td>
                  <td className="text-right p-1">{candle.close.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

// Generate demo candlestick data
function generateDemoData(): ChartData[] {
  const data: ChartData[] = []
  let basePrice = 43000
  const now = Math.floor(Date.now() / 1000)
  
  for (let i = 100; i >= 0; i--) {
    const time = now - i * 3600 // 1 hour intervals
    const volatility = basePrice * 0.02
    const open = basePrice + (Math.random() - 0.5) * volatility
    const close = open + (Math.random() - 0.5) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    
    data.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    
    basePrice = close
  }
  
  return data
}
