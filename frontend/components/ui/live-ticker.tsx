"use client"

import * as React from "react"
import { AssetIcon } from "./asset-icon"
import { PriceChange } from "./price-change"
import { useTickerData } from "@/hooks/use-market-data"

export function LiveTicker() {
  const { data: markets, isLoading } = useTickerData()

  if (isLoading || !markets) {
    return (
      <div className="w-full bg-card border-b border-border py-2">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 min-w-[180px]">
                <div className="h-6 w-6 skeleton rounded-full" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Take top 10 markets for ticker
  const tickerMarkets = markets.slice(0, 10)

  return (
    <div className="w-full bg-card border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-8 animate-scroll overflow-x-auto scrollbar-hide">
          {tickerMarkets.map((market) => (
            <div
              key={market.symbol}
              className="flex items-center gap-3 min-w-fit cursor-pointer hover:opacity-80 transition-opacity"
            >
              <AssetIcon symbol={market.baseAsset} size="sm" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {market.baseAsset}
                </span>
                <span className="text-sm font-mono font-medium">
                  £{market.price.toLocaleString('en-GB', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                <PriceChange 
                  value={market.change24h} 
                  type="percentage" 
                  size="sm"
                  showArrow={false}
                  animate
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}









