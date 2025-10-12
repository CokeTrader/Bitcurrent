"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetIcon } from "@/components/ui/asset-icon"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Holding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercent: number
}

interface HoldingsListProps {
  holdings: Holding[]
}

export function HoldingsList({ holdings }: HoldingsListProps) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Your Holdings</h3>
        <Link href="/trade/BTC-GBP">
          <Button size="sm">
            Add Position
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {holdings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No holdings yet</p>
            <Link href="/markets">
              <Button>Browse Markets</Button>
            </Link>
          </div>
        ) : (
          holdings.map((holding) => (
            <Link
              key={holding.symbol}
              href={`/trade/${holding.symbol}-GBP`}
              className="block"
            >
              <div className="p-4 rounded-lg border hover:border-primary transition cursor-pointer">
                <div className="flex items-center justify-between">
                  {/* Left: Asset info */}
                  <div className="flex items-center gap-3">
                    <AssetIcon symbol={holding.symbol} size={40} />
                    <div>
                      <div className="font-semibold">{holding.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {holding.quantity.toFixed(8)} {holding.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Right: Value & P&L */}
                  <div className="text-right">
                    <div className="font-semibold font-mono">
                      £{holding.value.toLocaleString('en-GB', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${
                      holding.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {holding.pnlPercent >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {holding.pnlPercent >= 0 ? '+' : ''}
                      {holding.pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Price info */}
                <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <span>Avg: £{holding.avgPrice.toLocaleString()}</span>
                  <span>Current: £{holding.currentPrice.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {holdings.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Portfolio Value</span>
            <span className="font-bold font-mono">
              £{totalValue.toLocaleString('en-GB', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

