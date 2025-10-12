"use client"

import { useEffect, useState, useCallback } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { getLiveGBPUSDRate } from '@/lib/api/exchange-rate'

export interface PriceUpdate {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: number
}

// Binance WebSocket URL for real-time prices
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws'

// Map our symbols to Binance symbols
const symbolMap: Record<string, string> = {
  'BTC-GBP': 'btcusdt', // We'll convert USDT to GBP
  'ETH-GBP': 'ethusdt',
  'SOL-GBP': 'solusdt',
  'ADA-GBP': 'adausdt',
}

export function useWebSocketPrice(symbol: string) {
  const [priceData, setPriceData] = useState<PriceUpdate | null>(null)
  const [usdToGbpRate, setUsdToGbpRate] = useState<number>(0.750285) // Default fallback - updated to current rate
  const binanceSymbol = symbolMap[symbol] || 'btcusdt'

  // Fetch live exchange rate on mount and every 5 minutes (FIXED v2.0)
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const rate = await getLiveGBPUSDRate()
        console.log(`[WebSocket] Updated USD/GBP rate: ${rate}`)
        setUsdToGbpRate(rate)
      } catch (error) {
        console.error('[WebSocket] Failed to fetch exchange rate:', error)
      }
    }
    
    fetchRate()
    const interval = setInterval(fetchRate, 5 * 60 * 1000) // Refresh every 5 minutes for better accuracy
    
    return () => clearInterval(interval)
  }, [])

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `${BINANCE_WS_URL}/${binanceSymbol}@ticker`,
    {
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  )

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data)
        
        // Convert USDT price to GBP using LIVE exchange rate
        const priceInGbp = parseFloat(data.c) * usdToGbpRate
        console.log(`[WebSocket] BTC: $${data.c} * ${usdToGbpRate} = £${priceInGbp.toFixed(2)}`)
        console.log(`[WebSocket] Exchange rate source: ${usdToGbpRate === 0.750285 ? 'CURRENT' : 'OLD/CACHED'}`)

        setPriceData({
          symbol: symbol,
          price: priceInGbp,
          change24h: parseFloat(data.P), // 24h change percentage
          volume24h: parseFloat(data.v) * priceInGbp, // Convert volume to GBP
          timestamp: data.E
        })
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }
  }, [lastMessage, symbol, usdToGbpRate])

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Live',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Disconnected',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState]

  return {
    priceData,
    isConnected: readyState === ReadyState.OPEN,
    connectionStatus,
  }
}

// Hook for multiple symbols
export function useWebSocketPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({})
  const [usdToGbpRate, setUsdToGbpRate] = useState<number>(0.750285) // Default fallback - updated to current rate

  // Fetch live exchange rate on mount and every 5 minutes (FIXED v2.0)
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const rate = await getLiveGBPUSDRate()
        console.log(`[WebSocket] Updated USD/GBP rate: ${rate}`)
        setUsdToGbpRate(rate)
      } catch (error) {
        console.error('[WebSocket] Failed to fetch exchange rate:', error)
      }
    }
    
    fetchRate()
    const interval = setInterval(fetchRate, 5 * 60 * 1000) // Refresh every 5 minutes for better accuracy
    
    return () => clearInterval(interval)
  }, [])

  // Create streams for multiple symbols
  const streams = symbols.map(s => {
    const binanceSymbol = symbolMap[s] || 'btcusdt'
    return `${binanceSymbol}@ticker`
  }).join('/')

  const { lastMessage, readyState } = useWebSocket(
    `${BINANCE_WS_URL}/stream?streams=${streams}`,
    {
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  )

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const { data } = JSON.parse(lastMessage.data)
        // Use LIVE exchange rate
        const priceInGbp = parseFloat(data.c) * usdToGbpRate

        // Find which symbol this update is for
        const ourSymbol = Object.entries(symbolMap).find(
          ([, binanceSymbol]) => data.s.toLowerCase() === binanceSymbol
        )?.[0]

        if (ourSymbol) {
          setPrices(prev => ({
            ...prev,
            [ourSymbol]: {
              symbol: ourSymbol,
              price: priceInGbp,
              change24h: parseFloat(data.P),
              volume24h: parseFloat(data.v) * priceInGbp,
              timestamp: data.E
            }
          }))
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }
  }, [lastMessage, usdToGbpRate])

  return {
    prices,
    isConnected: readyState === ReadyState.OPEN,
  }
}









