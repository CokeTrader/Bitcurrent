"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetIcon } from "@/components/ui/asset-icon"
import { PriceChange } from "@/components/ui/price-change"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Send, 
  QrCode,
  Copy,
  ExternalLink,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface WalletCardProps {
  asset: string
  name: string
  balance: number
  value: number
  change24h: number
  price: number
  depositAddress?: string
  canStake?: boolean
  className?: string
}

export function WalletCard({
  asset,
  name,
  balance,
  value,
  change24h,
  price,
  depositAddress,
  canStake = false,
  className
}: WalletCardProps) {
  const [showAddress, setShowAddress] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <AssetIcon symbol={asset} size="lg" />
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{asset} Wallet</p>
          </div>
        </div>
        {canStake && (
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Stakeable
          </Badge>
        )}
      </div>

      {/* Balance */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
        <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
        <p className="text-3xl font-bold font-mono mb-2">
          {balance.toFixed(8)} {asset}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-muted-foreground">
            ≈ £{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
          <PriceChange value={change24h} type="percentage" size="sm" />
        </div>
      </div>

      {/* Current Price */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <span className="text-sm text-muted-foreground">Current Price</span>
        <span className="font-mono font-semibold">
          £{price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button variant="default" className="w-full">
          <ArrowDownToLine className="h-4 w-4" />
          Deposit
        </Button>
        <Button variant="outline" className="w-full">
          <ArrowUpFromLine className="h-4 w-4" />
          Withdraw
        </Button>
        <Button variant="outline" className="w-full">
          <Send className="h-4 w-4" />
          Send
        </Button>
        <Button variant="outline" className="w-full">
          <ExternalLink className="h-4 w-4" />
          Buy More
        </Button>
      </div>

      {/* Deposit Address Section */}
      {depositAddress && (
        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddress(!showAddress)}
            className="w-full justify-between"
          >
            <span className="text-sm font-medium">Deposit Address</span>
            <QrCode className="h-4 w-4" />
          </Button>
          
          {showAddress && (
            <div className="mt-3 p-3 rounded-lg bg-muted">
              <p className="text-xs font-mono break-all mb-2">
                {depositAddress}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="w-full"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy Address"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}









