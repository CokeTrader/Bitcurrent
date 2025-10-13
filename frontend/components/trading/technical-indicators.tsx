"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TechnicalIndicatorsProps {
  symbol: string
}

export function TechnicalIndicators({ symbol }: TechnicalIndicatorsProps) {
  // Mock data (replace with real calculations)
  const indicators = {
    rsi: {
      value: 65.4,
      signal: "Neutral",
      description: "RSI shows moderate momentum"
    },
    macd: {
      value: 234.56,
      signal: "Buy",
      description: "MACD crossed above signal line"
    },
    bollingerBands: {
      upper: 62000,
      middle: 60000,
      lower: 58000,
      currentPrice: 60500,
      signal: "Overbought",
      description: "Price near upper band"
    },
    movingAverages: {
      sma20: 59500,
      sma50: 58000,
      sma200: 55000,
      signal: "Bullish",
      description: "Price above all MAs"
    },
    volume: {
      current: 1234567,
      avg: 987654,
      signal: "High",
      description: "Volume 25% above average"
    }
  }

  const getSignalColor = (signal: string) => {
    if (signal === "Buy" || signal === "Bullish") return "text-green-600"
    if (signal === "Sell" || signal === "Bearish") return "text-red-600"
    return "text-muted-foreground"
  }

  const getSignalIcon = (signal: string) => {
    if (signal === "Buy" || signal === "Bullish") return <TrendingUp className="h-4 w-4" />
    if (signal === "Sell" || signal === "Bearish") return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Technical Analysis</h3>
      
      <div className="space-y-4">
        {/* RSI */}
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">RSI (14)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">{indicators.rsi.value}</span>
              <Badge variant="outline" className={getSignalColor(indicators.rsi.signal)}>
                {indicators.rsi.signal}
              </Badge>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                indicators.rsi.value > 70 ? 'bg-red-500' : 
                indicators.rsi.value < 30 ? 'bg-green-500' : 
                'bg-yellow-500'
              }`}
              style={{ width: `${indicators.rsi.value}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{indicators.rsi.description}</p>
        </div>

        {/* MACD */}
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">MACD</span>
            <div className="flex items-center gap-2">
              {getSignalIcon(indicators.macd.signal)}
              <Badge variant="outline" className={getSignalColor(indicators.macd.signal)}>
                {indicators.macd.signal}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{indicators.macd.description}</p>
        </div>

        {/* Bollinger Bands */}
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Bollinger Bands</span>
            <Badge variant="outline" className={getSignalColor(indicators.bollingerBands.signal)}>
              {indicators.bollingerBands.signal}
            </Badge>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upper:</span>
              <span>£{indicators.bollingerBands.upper.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Middle:</span>
              <span>£{indicators.bollingerBands.middle.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lower:</span>
              <span>£{indicators.bollingerBands.lower.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Current:</span>
              <span>£{indicators.bollingerBands.currentPrice.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{indicators.bollingerBands.description}</p>
        </div>

        {/* Moving Averages */}
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Moving Averages</span>
            <Badge variant="outline" className={getSignalColor(indicators.movingAverages.signal)}>
              {indicators.movingAverages.signal}
            </Badge>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SMA 20:</span>
              <span>£{indicators.movingAverages.sma20.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SMA 50:</span>
              <span>£{indicators.movingAverages.sma50.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SMA 200:</span>
              <span>£{indicators.movingAverages.sma200.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{indicators.movingAverages.description}</p>
        </div>

        {/* Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Volume (24h)</span>
            <Badge variant="outline" className={getSignalColor(indicators.volume.signal)}>
              {indicators.volume.signal}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{indicators.volume.description}</p>
        </div>

        {/* Overall Signal */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-bold text-green-700 dark:text-green-300">Overall: Bullish</span>
          </div>
          <p className="text-xs text-muted-foreground">
            3 out of 5 indicators suggest upward momentum. Consider buying opportunities.
          </p>
        </div>
      </div>
    </Card>
  )
}


