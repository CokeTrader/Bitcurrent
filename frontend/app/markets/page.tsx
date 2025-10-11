"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AssetIcon } from "@/components/ui/asset-icon"
import { PriceChange } from "@/components/ui/price-change"
import { useMarketData, useTrendingCoins } from "@/hooks/use-market-data"
import { Search, Star, TrendingUp, Filter, ArrowUpDown } from "lucide-react"
import Link from "next/link"

type SortKey = "name" | "price" | "change24h" | "volume24h" | "marketCap"

export default function MarketsPage() {
  const { data: markets, isLoading } = useMarketData('gbp')
  const { data: trending } = useTrendingCoins()
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState<SortKey>("marketCap")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set())

  // Filter markets based on search
  const filteredMarkets = React.useMemo(() => {
    if (!markets) return []
    
    return markets.filter(market => {
      const searchLower = searchQuery.toLowerCase()
      return (
        market.baseAsset.toLowerCase().includes(searchLower) ||
        market.name.toLowerCase().includes(searchLower)
      )
    })
  }, [markets, searchQuery])

  // Sort markets
  const sortedMarkets = React.useMemo(() => {
    return [...filteredMarkets].sort((a, b) => {
      let aVal: number, bVal: number
      
      switch (sortKey) {
        case "name":
          return sortDirection === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        case "price":
          aVal = a.price
          bVal = b.price
          break
        case "change24h":
          aVal = a.change24h
          bVal = b.change24h
          break
        case "volume24h":
          aVal = a.volume24h
          bVal = b.volume24h
          break
        case "marketCap":
          aVal = a.marketCap
          bVal = b.marketCap
          break
        default:
          return 0
      }
      
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [filteredMarkets, sortKey, sortDirection])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const toggleFavorite = (symbol: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol)
    } else {
      newFavorites.add(symbol)
    }
    setFavorites(newFavorites)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Markets</h1>
          <p className="text-muted-foreground">
            Live cryptocurrency prices and trading pairs
          </p>
        </div>

        {/* Trending Section */}
        {!isLoading && markets && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Trending Now</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {markets.slice(0, 6).map((market) => (
                <Link
                  key={market.symbol}
                  href={`/trade/${market.symbol}`}
                  className="flex-shrink-0"
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer min-w-[200px]">
                    <AssetIcon symbol={market.baseAsset} size="md" />
                    <div>
                      <div className="font-semibold text-sm">{market.baseAsset}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm">
                          £{market.price.toLocaleString('en-GB')}
                        </span>
                        <PriceChange value={market.change24h} size="sm" showArrow={false} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrency by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Star className="h-4 w-4" />
                Favorites
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Markets Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="text-left font-medium pb-4 w-8"></th>
                  <th className="text-left font-medium pb-4">
                    <button
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right font-medium pb-4">
                    <button
                      onClick={() => handleSort("price")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Price
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right font-medium pb-4">
                    <button
                      onClick={() => handleSort("change24h")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      24h Change
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right font-medium pb-4">
                    <button
                      onClick={() => handleSort("volume24h")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      24h Volume
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right font-medium pb-4">
                    <button
                      onClick={() => handleSort("marketCap")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Market Cap
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right font-medium pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-4" colSpan={7}>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 skeleton rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 skeleton rounded" />
                            <div className="h-3 w-24 skeleton rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  sortedMarkets.map((market) => (
                    <tr
                      key={market.symbol}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors group"
                    >
                      <td className="py-4">
                        <button
                          onClick={() => toggleFavorite(market.symbol)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              favorites.has(market.symbol)
                                ? "fill-warning text-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <AssetIcon symbol={market.baseAsset} size="md" />
                          <div>
                            <div className="font-semibold">{market.baseAsset}</div>
                            <div className="text-xs text-muted-foreground">{market.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-mono font-semibold">
                        £{market.price.toLocaleString('en-GB', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: market.price > 100 ? 2 : 8
                        })}
                      </td>
                      <td className="text-right">
                        <PriceChange value={market.change24h} type="percentage" />
                      </td>
                      <td className="text-right font-mono text-sm">
                        £{(market.volume24h / 1000000).toFixed(2)}M
                      </td>
                      <td className="text-right font-mono text-sm">
                        £{(market.marketCap / 1000000000).toFixed(2)}B
                      </td>
                      <td className="text-right">
                        <Link href={`/trade/${market.symbol}`}>
                          <Button variant="outline" size="sm">
                            Trade
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && sortedMarkets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No markets found matching "{searchQuery}"</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          )}

          {!isLoading && sortedMarkets.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {sortedMarkets.length} markets • Updated every 30 seconds
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

