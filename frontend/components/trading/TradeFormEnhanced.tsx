"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

export interface TradeFormProps {
  symbol: string
  currentPrice?: number
  balance?: {
    base: number
    quote: number
  }
  onSubmit?: (trade: TradeOrder) => void
  className?: string
}

export interface TradeOrder {
  side: "buy" | "sell"
  type: "market" | "limit" | "stop"
  amount: number
  price?: number
  total: number
}

const orderTypes = [
  { value: "market", label: "Market", description: "Execute immediately at best price" },
  { value: "limit", label: "Limit", description: "Buy/sell at specific price" },
  { value: "stop", label: "Stop-Loss", description: "Trigger when price reaches level" },
]

export function TradeFormEnhanced({
  symbol,
  currentPrice, // MUST be provided - no default
  balance = { base: 0, quote: 0 }, // Default to 0 - forces real data
  onSubmit,
  className
}: TradeFormProps) {
  // Don't render if no real price
  if (!currentPrice || currentPrice <= 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center py-8">
          <div className="h-12 w-12 skeleton rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading real-time prices...</p>
        </div>
      </Card>
    )
  }
  const [side, setSide] = React.useState<"buy" | "sell">("buy")
  const [orderType, setOrderType] = React.useState("market")
  const [amount, setAmount] = React.useState("")
  const [price, setPrice] = React.useState(currentPrice.toString())
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const baseAsset = symbol.split("-")[0]
  const quoteAsset = symbol.split("-")[1]

  // Calculate total
  const total = React.useMemo(() => {
    const amt = parseFloat(amount) || 0
    const prc = orderType === "market" ? currentPrice : parseFloat(price) || 0
    return amt * prc
  }, [amount, price, orderType, currentPrice])

  // Calculate fee (0.5% trading fee)
  const fee = total * 0.005
  const totalWithFee = total + (side === "buy" ? fee : -fee)

  // Check if user has sufficient balance
  const hasSufficientBalance = side === "buy"
    ? balance.quote >= totalWithFee
    : balance.base >= parseFloat(amount || "0")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasSufficientBalance) {
      alert("Insufficient balance")
      return
    }

    setIsSubmitting(true)

    const trade: TradeOrder = {
      side,
      type: orderType as any,
      amount: parseFloat(amount),
      price: orderType !== "market" ? parseFloat(price) : undefined,
      total: totalWithFee
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onSubmit?.(trade)
    
    // Reset form
    setAmount("")
    setIsSubmitting(false)
    
    // Show success (in production, this would be a toast notification)
    alert(`${side.toUpperCase()} order placed successfully!`)
  }

  return (
    <Card className={cn("p-6", className)}>
      <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger 
            value="buy" 
            className="data-[state=active]:bg-success data-[state=active]:text-white font-semibold"
          >
            Buy {baseAsset}
          </TabsTrigger>
          <TabsTrigger 
            value="sell"
            className="data-[state=active]:bg-danger data-[state=active]:text-white font-semibold"
          >
            Sell {baseAsset}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={side} className="space-y-4 mt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger id="orderType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price (for limit/stop orders) */}
            {orderType !== "market" && (
              <div className="space-y-2">
                <Label htmlFor="price">Price ({quoteAsset})</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="font-mono"
                />
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({baseAsset})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Available: {side === "buy" 
                    ? `£${balance.quote.toLocaleString('en-GB')}`
                    : `${balance.base.toFixed(8)} ${baseAsset}`
                  }
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (side === "buy") {
                      const maxAmount = (balance.quote * 0.995) / currentPrice
                      setAmount(maxAmount.toFixed(8))
                    } else {
                      setAmount(balance.base.toString())
                    }
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Use Max
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono font-medium">
                  £{(orderType === "market" ? currentPrice : parseFloat(price) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono font-medium">
                  {parseFloat(amount) || 0} {baseAsset}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Fee (0.5%)</span>
                <span className="font-mono font-medium">
                  £{fee.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-mono font-bold">
                  £{totalWithFee.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {!hasSufficientBalance && parseFloat(amount) > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                <Info className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Insufficient Balance</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    You need {side === "buy" 
                      ? `£${(totalWithFee - balance.quote).toFixed(2)} more`
                      : `${(parseFloat(amount) - balance.base).toFixed(8)} ${baseAsset} more`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant={side === "buy" ? "default" : "destructive"}
              size="lg"
              className={cn(
                "w-full font-semibold text-base h-12",
                side === "buy" && "bg-success hover:bg-success/90",
                side === "sell" && "bg-danger hover:bg-danger/90"
              )}
              disabled={!hasSufficientBalance || !amount || parseFloat(amount) <= 0 || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting 
                ? "Placing Order..." 
                : `${side === "buy" ? "Buy" : "Sell"} ${baseAsset}`
              }
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}


