"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Zap } from "lucide-react"

interface QuickTradeWidgetProps {
  symbol: string
  currentPrice: number
  change24h: number
}

export function QuickTradeWidget({ symbol, currentPrice, change24h }: QuickTradeWidgetProps) {
  const [amount, setAmount] = useState("")
  const [side, setSide] = useState<"buy" | "sell">("buy")

  const calculateQuantity = () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return "0"
    return (amt / currentPrice).toFixed(8)
  }

  const handleQuickTrade = async () => {
    // TODO: Connect to API
    console.log("Quick trade:", { symbol, amount, side })
  }

  return (
    <Card className="p-6 border-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Trade
        </h3>
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          change24h >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {change24h.toFixed(2)}%
        </div>
      </div>

      <div className="space-y-4">
        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === "buy" ? "default" : "outline"}
            onClick={() => setSide("buy")}
            className={side === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Buy {symbol}
          </Button>
          <Button
            variant={side === "sell" ? "default" : "outline"}
            onClick={() => setSide("sell")}
            className={side === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Sell {symbol}
          </Button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Amount (GBP)</label>
          <Input
            type="number"
            placeholder="£100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg font-mono"
          />
          {amount && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {calculateQuantity()} {symbol}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[10, 50, 100, 500].map((amt) => (
            <Button
              key={amt}
              variant="outline"
              size="sm"
              onClick={() => setAmount(amt.toString())}
            >
              £{amt}
            </Button>
          ))}
        </div>

        {/* Current Price */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-mono font-semibold">
              £{currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Fee (0.25%):</span>
            <span className="font-mono">
              £{(parseFloat(amount || "0") * 0.0025).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1 pt-2 border-t">
            <span className="font-medium">Total:</span>
            <span className="font-mono font-bold">
              £{(parseFloat(amount || "0") * (side === "buy" ? 1.0025 : 0.9975)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Trade Button */}
        <Button
          onClick={handleQuickTrade}
          disabled={!amount || parseFloat(amount) <= 0}
          className={`w-full h-12 text-lg font-bold ${
            side === "buy" 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {side === "buy" ? "Buy" : "Sell"} {symbol} Instantly
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Market order • Instant execution • 0.25% fee
        </p>
      </div>
    </Card>
  )
}

