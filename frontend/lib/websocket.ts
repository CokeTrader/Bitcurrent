"use client"

import { io, Socket } from 'socket.io-client'

type SubscriptionCallback = (data: any) => void

class WebSocketClient {
  private socket: Socket | null = null
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5 // Reduced from 10
  private reconnectDelay = 2000 // Increased from 1000
  private isConnecting = false
  private connectionFailed = false

  connect(url: string) {
    if (this.socket?.connected || this.isConnecting || this.connectionFailed) return
    
    this.isConnecting = true

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000, // Max 10 seconds between retries
      timeout: 5000, // Connection timeout
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.isConnecting = false
      this.connectionFailed = false
      // Resubscribe to all channels
      this.subscriptions.forEach((_, channel) => {
        this.socket?.emit('subscribe', channel)
      })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      this.isConnecting = false
    })

    this.socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message)
      this.isConnecting = false
    })

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`)
      this.reconnectAttempts = attempt
    })

    this.socket.on('reconnect_failed', () => {
      console.warn('WebSocket reconnection failed after max attempts. Disabling WebSocket.')
      this.connectionFailed = true
      this.isConnecting = false
      this.disconnect()
    })

    // Handle incoming messages
    this.socket.onAny((event, data) => {
      const callbacks = this.subscriptions.get(event)
      if (callbacks) {
        callbacks.forEach(callback => callback(data))
      }
    })
  }

  subscribe(channel: string, callback: SubscriptionCallback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      this.socket?.emit('subscribe', channel)
    }
    
    this.subscriptions.get(channel)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channel)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel)
          this.socket?.emit('unsubscribe', channel)
        }
      }
    }
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.subscriptions.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// Singleton instance
export const wsClient = new WebSocketClient()

// React hook for WebSocket subscriptions
import { useEffect, useState } from 'react'

export function useWebSocket<T>(channel: string, initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Initialize connection if not already connected
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
    wsClient.connect(wsUrl)

    setConnected(wsClient.isConnected())

    // Subscribe to channel
    const unsubscribe = wsClient.subscribe(channel, (newData: T) => {
      setData(newData)
    })

    return () => {
      unsubscribe()
    }
  }, [channel])

  return { data, connected }
}



