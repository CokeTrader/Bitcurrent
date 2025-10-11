"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetIcon } from "@/components/ui/asset-icon"
import { PriceChange } from "@/components/ui/price-change"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

export interface Asset {
  symbol: string
  name: string
  balance: number
  value: number
  change24h: number
  price: number
}

export interface AssetsTableProps {
  assets?: Asset[]
  loading?: boolean
}

// For NEW/EMPTY accounts: Return empty array
// In production, balances would come from backend API
const getDemoAssets = async (): Promise<Asset[]> => {
  // NEW accounts have NO assets yet
  // User needs to deposit first
  return []
}

const sampleAssets: Asset[] = [] // Empty for new accounts

export function AssetsTable({ assets, loading = false }: AssetsTableProps) {
  const [sortKey, setSortKey] = React.useState<keyof Asset>("value")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")
  const [realAssets, setRealAssets] = React.useState<Asset[]>(assets || [])
  
  // Fetch real prices on mount if no assets provided
  React.useEffect(() => {
    if (!assets || assets.length === 0) {
      getDemoAssets().then(setRealAssets)
    }
  }, [assets])
  
  const displayAssets = assets || realAssets

  const sortedAssets = React.useMemo(() => {
    return [...displayAssets].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      const modifier = sortDirection === "asc" ? 1 : -1
      return aVal > bVal ? modifier : -modifier
    })
  }, [assets, sortKey, sortDirection])

  const handleSort = (key: keyof Asset) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 skeleton rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // Show empty state if no assets
  if (displayAssets.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Your Assets</h3>
        </div>
        
        <div className="text-center py-12">
          <div className="mb-4 text-muted-foreground">
            <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium mb-2">No Assets Yet</p>
            <p className="text-sm mb-6">Deposit funds to start building your portfolio</p>
          </div>
          <Link href="/deposit">
            <Button size="lg">
              Deposit Funds
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Your Assets</h3>
        <Button variant="outline" size="sm">
          + Add Asset
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="text-left font-medium pb-3">Asset</th>
              <th className="text-right font-medium pb-3">
                <button
                  onClick={() => handleSort("balance")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Balance
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-right font-medium pb-3">
                <button
                  onClick={() => handleSort("value")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Value
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-right font-medium pb-3">
                <button
                  onClick={() => handleSort("change24h")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  24h Change
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-right font-medium pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map((asset) => (
              <tr
                key={asset.symbol}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <AssetIcon symbol={asset.symbol} size="md" showSymbol={false} />
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right font-mono">
                  <div>{asset.balance.toFixed(8)}</div>
                  <div className="text-xs text-muted-foreground">
                    @ £{asset.price.toLocaleString('en-GB')}
                  </div>
                </td>
                <td className="text-right font-mono font-semibold">
                  £{asset.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="text-right">
                  <PriceChange value={asset.change24h} type="percentage" showArrow />
                </td>
                <td className="text-right">
                  <Link href={`/trade/${asset.symbol}-GBP`}>
                    <Button variant="outline" size="sm">
                      Trade
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <Link href="/wallets">
          <Button variant="ghost">
            View All Assets →
          </Button>
        </Link>
      </div>
    </Card>
  )
}


