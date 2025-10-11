"use client"

import { useQuery } from "@tanstack/react-query"
import { coinGeckoService } from "@/lib/coingecko"

export function useMarketData(currency: string = 'gbp') {
  return useQuery({
    queryKey: ['markets', currency],
    queryFn: async () => {
      const data = await coinGeckoService.getMarkets(currency)
      return coinGeckoService.mapToMarketData(data)
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider fresh for 20 seconds
  })
}

export function useTrendingCoins() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: () => coinGeckoService.getTrending(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 45000,
  })
}

export function useCoinPrice(coinId: string, currency: string = 'gbp') {
  return useQuery({
    queryKey: ['price', coinId, currency],
    queryFn: () => coinGeckoService.getPrices([coinId], currency),
    refetchInterval: 10000, // Refresh every 10 seconds for individual coin
    staleTime: 5000,
  })
}

export function useTickerData() {
  return useQuery({
    queryKey: ['ticker'],
    queryFn: () => coinGeckoService.getTickerData(),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000,
  })
}







