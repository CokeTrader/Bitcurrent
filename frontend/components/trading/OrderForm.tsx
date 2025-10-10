"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatGBP, formatCrypto } from "@/lib/utils"
import { AlertCircle, Info } from "lucide-react"

interface OrderFormProps {
  symbol: string
  currentPrice?: number
  balance?: {
    base: number
    quote: number
  }
  onOrderPlaced?: () => void
}

type OrderSide = 'buy' | 'sell'
type OrderType = 'market' | 'limit' | 'stop-loss'

export function OrderForm({
  symbol,
  currentPrice = 43250.50,
  balance = { base: 0.5, quote: 5000 },
  onOrderPlaced
}: OrderFormProps) {
  const [side, setSide] = React.useState<OrderSide>('buy')
  const [orderType, setOrderType] = React.useState<OrderType>('market')
  const [advancedMode, setAdvancedMode] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  
  // Order parameters
  const [amount, setAmount] = React.useState("")
  const [price, setPrice] = React.useState(currentPrice.toString())
  const [stopPrice, setStopPrice] = React.useState("")
  const [timeInForce, setTimeInForce] = React.useState("GTC")
  const [postOnly, setPostOnly] = React.useState(false)

  const [baseAsset, quoteAsset] = symbol.split('-')

  // Calculate fees and totals
  const amountNum = parseFloat(amount) || 0
  const priceNum = orderType === 'market' ? currentPrice : parseFloat(price) || 0
  const totalBeforeFee = amountNum * priceNum
  const feeRate = side === 'buy' ? 0.0025 : 0.0015 // 0.25% taker, 0.15% maker
  const fee = totalBeforeFee * feeRate
  const totalWithFee = side === 'buy' ? totalBeforeFee + fee : totalBeforeFee - fee

  // Validate sufficient balance
  const hasSufficientBalance = side === 'buy'
    ? totalWithFee <= balance.quote
    : amountNum <= balance.base

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { apiClient } = await import("@/lib/api/client")
      
      const orderData = {
        symbol: symbol,
        side: side,
        order_type: orderType === 'market' ? 'market' as const : 'limit' as const,
        price: orderType === 'limit' ? price : undefined,
        quantity: amount,
        time_in_force: timeInForce,
        post_only: postOnly,
      }
      
      await apiClient.placeOrder(orderData)
      
      // Reset form
      setAmount("")
      setPrice(currentPrice.toString())
      
      // Show success (toast notification)
      onOrderPlaced?.()
    } catch (error: any) {
      console.error("Order placement failed:", error)
      const message = error.response?.data?.message || "Failed to place order. Please try again."
      // TODO: Show error toast
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Place Order</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdvancedMode(!advancedMode)}
            className="text-xs"
          >
            {advancedMode ? "Basic" : "Advanced"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Buy/Sell Tabs */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={side === 'buy' ? "buy" : "outline"}
            size="lg"
            onClick={() => setSide('buy')}
            className={cn("font-semibold", side === 'buy' && "shadow-lg")}
          >
            Buy {baseAsset}
          </Button>
          <Button
            type="button"
            variant={side === 'sell' ? "sell" : "outline"}
            size="lg"
            onClick={() => setSide('sell')}
            className={cn("font-semibold", side === 'sell' && "shadow-lg")}
          >
            Sell {baseAsset}
          </Button>
        </div>

        {/* Order Type Selector - Advanced Mode */}
        {advancedMode && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={orderType === 'market' ? "default" : "ghost"}
              size="sm"
              onClick={() => setOrderType('market')}
              className="flex-1"
            >
              Market
            </Button>
            <Button
              type="button"
              variant={orderType === 'limit' ? "default" : "ghost"}
              size="sm"
              onClick={() => setOrderType('limit')}
              className="flex-1"
            >
              Limit
            </Button>
            <Button
              type="button"
              variant={orderType === 'stop-loss' ? "default" : "ghost"}
              size="sm"
              onClick={() => setOrderType('stop-loss')}
              className="flex-1"
            >
              Stop-Loss
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price - Limit Orders Only */}
          {orderType === 'limit' && (
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price ({quoteAsset})
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
                required
              />
            </div>
          )}

          {/* Stop Price - Stop-Loss Orders */}
          {orderType === 'stop-loss' && advancedMode && (
            <div className="space-y-2">
              <label htmlFor="stopPrice" className="text-sm font-medium">
                Stop Price ({quoteAsset})
              </label>
              <Input
                id="stopPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="font-mono"
                required
              />
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount ({baseAsset})
              </label>
              <button
                type="button"
                onClick={() => {
                  if (side === 'buy') {
                    const maxAmount = (balance.quote * 0.99) / priceNum
                    setAmount(maxAmount.toFixed(8))
                  } else {
                    setAmount((balance.base * 0.99).toFixed(8))
                  }
                }}
                className="text-xs text-primary hover:underline"
              >
                Max
              </button>
            </div>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="0.00000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
              required
            />
          </div>

          {/* Quick Amount Selectors */}
          <div className="grid grid-cols-4 gap-2">
            {['25%', '50%', '75%', '100%'].map((percent) => (
              <Button
                key={percent}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const percentage = parseInt(percent) / 100
                  if (side === 'buy') {
                    const maxAmount = (balance.quote * percentage) / priceNum
                    setAmount(maxAmount.toFixed(8))
                  } else {
                    setAmount((balance.base * percentage).toFixed(8))
                  }
                }}
                className="text-xs"
              >
                {percent}
              </Button>
            ))}
          </div>

          {/* Advanced Options */}
          {advancedMode && orderType === 'limit' && (
            <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30">
              <div className="flex items-center justify-between">
                <label htmlFor="timeInForce" className="text-sm font-medium">
                  Time in Force
                </label>
                <select
                  id="timeInForce"
                  value={timeInForce}
                  onChange={(e) => setTimeInForce(e.target.value)}
                  className="text-sm bg-background border border-input rounded px-2 py-1"
                >
                  <option value="GTC">Good Till Cancel</option>
                  <option value="IOC">Immediate or Cancel</option>
                  <option value="FOK">Fill or Kill</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="postOnly" className="text-sm font-medium">
                  Post-Only (Maker)
                </label>
                <input
                  type="checkbox"
                  id="postOnly"
                  checked={postOnly}
                  onChange={(e) => setPostOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
              </div>
            </div>
          )}

          {/* Balance Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available:</span>
            <span className="font-mono">
              {side === 'buy'
                ? formatGBP(balance.quote)
                : `${formatCrypto(balance.base)} ${baseAsset}`}
            </span>
          </div>

          {/* Fee Breakdown */}
          {amountNum > 0 && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Fee Breakdown:</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono">{formatGBP(totalBeforeFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Fee ({(feeRate * 100).toFixed(2)}% {postOnly ? 'Maker' : 'Taker'}):
                  </span>
                  <span className="font-mono">{formatGBP(fee)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-1">
                  <span>Total:</span>
                  <span className="font-mono">{formatGBP(totalWithFee)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient Balance Warning */}
          {amountNum > 0 && !hasSufficientBalance && (
            <div className="flex items-start gap-2 p-3 bg-sell/10 border border-sell/20 rounded-md text-sm text-sell">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Insufficient balance. You need {side === 'buy' ? formatGBP(totalWithFee) : `${formatCrypto(amountNum)} ${baseAsset}`}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="xl"
            variant={side}
            className="w-full font-semibold text-base"
            disabled={!amountNum || !hasSufficientBalance || loading}
            loading={loading}
          >
            {side === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
