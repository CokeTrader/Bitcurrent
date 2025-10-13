"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"

interface LimitOrderFormProps {
  symbol: string
  currentPrice: number
}

export function LimitOrderForm({ symbol, currentPrice }: LimitOrderFormProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [limitPrice, setLimitPrice] = useState("")
  const [amount, setAmount] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")

  const quantity = amount && limitPrice 
    ? (parseFloat(amount) / parseFloat(limitPrice)).toFixed(8)
    : "0"

  const handleSubmit = () => {
    // TODO: Connect to API
    toast.success(`Limit order placed!`, {
      description: `${side.toUpperCase()} ${quantity} ${symbol} at £${limitPrice}`
    })
  }

  return (
    <Card className="p-6">
      <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Buy {symbol}
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Sell {symbol}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={side} className="space-y-4">
          {/* Limit Price */}
          <div>
            <Label>Limit Price (GBP)</Label>
            <Input
              type="number"
              placeholder={currentPrice.toString()}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="text-lg font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: £{currentPrice.toLocaleString()}
            </p>
          </div>

          {/* Amount */}
          <div>
            <Label>Amount (GBP)</Label>
            <Input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-mono"
            />
            {amount && limitPrice && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {quantity} {symbol}
              </p>
            )}
          </div>

          {/* Stop Loss (Optional) */}
          <div>
            <Label>Stop Loss (Optional)</Label>
            <Input
              type="number"
              placeholder="Auto-calculate"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Exit if price drops to this level
            </p>
          </div>

          {/* Take Profit (Optional) */}
          <div>
            <Label>Take Profit (Optional)</Label>
            <Input
              type="number"
              placeholder="Set target"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-sell at this price
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span className="font-mono">{quantity} {symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Limit Price:</span>
              <span className="font-mono">£{limitPrice || "0"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fee (0.25%):</span>
              <span className="font-mono">
                £{amount ? (parseFloat(amount) * 0.0025).toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="font-mono">
                £{amount ? (parseFloat(amount) * (side === 'buy' ? 1.0025 : 0.9975)).toFixed(2) : "0.00"}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!limitPrice || !amount}
            className={`w-full h-12 text-lg font-bold ${
              side === 'buy' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Place Limit {side === 'buy' ? 'Buy' : 'Sell'} Order
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Order will execute when price reaches £{limitPrice || "..."} or better
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  )
}


