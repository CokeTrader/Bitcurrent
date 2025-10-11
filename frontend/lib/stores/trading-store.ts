// Trading Store - Manages balances, orders, and portfolio state
import { create } from 'zustand'

interface Balance {
  currency: string
  available: number
  locked: number
}

interface Order {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  price: number
  quantity: number
  filled: number
  status: 'open' | 'filled' | 'cancelled'
  created_at: number
}

interface Trade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  price: number
  quantity: number
  timestamp: number
}

interface TradingState {
  // Balances
  balances: Balance[]
  getBalance: (currency: string) => number
  updateBalance: (currency: string, amount: number) => void
  
  // Orders
  openOrders: Order[]
  orderHistory: Order[]
  addOrder: (order: Order) => void
  fillOrder: (orderId: string, price: number, quantity: number) => void
  cancelOrder: (orderId: string) => void
  
  // Trades
  tradeHistory: Trade[]
  addTrade: (trade: Trade) => void
  
  // Portfolio
  portfolioValue: number
  updatePortfolioValue: () => void
  
  // Reset (for logout)
  reset: () => void
}

export const useTradingStore = create<TradingState>((set, get) => ({
  // Initial state - EMPTY for NEW accounts
  balances: [
    { currency: 'GBP', available: 0.00, locked: 0.00 },
    { currency: 'BTC', available: 0.00, locked: 0.00 },
    { currency: 'ETH', available: 0.00, locked: 0.00 },
    { currency: 'SOL', available: 0.00, locked: 0.00 },
  ],
  openOrders: [],
  orderHistory: [],
  tradeHistory: [],
  portfolioValue: 0.00,

  getBalance: (currency: string) => {
    const balance = get().balances.find(b => b.currency === currency)
    return balance?.available || 0
  },

  updateBalance: (currency: string, amount: number) => {
    set((state) => ({
      balances: state.balances.map(b =>
        b.currency === currency
          ? { ...b, available: b.available + amount }
          : b
      )
    }))
    get().updatePortfolioValue()
  },

  addOrder: (order: Order) => {
    set((state) => ({
      openOrders: [order, ...state.openOrders]
    }))
    
    // Lock funds for the order
    const { symbol, side, price, quantity } = order
    if (side === 'buy') {
      const quoteAmount = price * quantity
      set((state) => ({
        balances: state.balances.map(b =>
          b.currency === 'GBP'
            ? { ...b, available: b.available - quoteAmount, locked: b.locked + quoteAmount }
            : b
        )
      }))
    } else {
      const [baseAsset] = symbol.split('-')
      set((state) => ({
        balances: state.balances.map(b =>
          b.currency === baseAsset
            ? { ...b, available: b.available - quantity, locked: b.locked + quantity }
            : b
        )
      }))
    }
  },

  fillOrder: (orderId: string, price: number, quantity: number) => {
    const order = get().openOrders.find(o => o.id === orderId)
    if (!order) return

    const [baseAsset] = order.symbol.split('-')

    // Move order to history
    set((state) => ({
      openOrders: state.openOrders.filter(o => o.id !== orderId),
      orderHistory: [{
        ...order,
        status: 'filled',
        filled: quantity,
        price: price
      }, ...state.orderHistory]
    }))

    // Add to trade history
    get().addTrade({
      id: `trade-${Date.now()}`,
      symbol: order.symbol,
      side: order.side,
      price,
      quantity,
      timestamp: Date.now()
    })

    // Update balances
    if (order.side === 'buy') {
      // Unlock GBP, add crypto
      const quoteAmount = price * quantity
      set((state) => ({
        balances: state.balances.map(b => {
          if (b.currency === 'GBP') {
            return { ...b, locked: b.locked - quoteAmount }
          }
          if (b.currency === baseAsset) {
            return { ...b, available: b.available + quantity }
          }
          return b
        })
      }))
    } else {
      // Unlock crypto, add GBP
      const quoteAmount = price * quantity
      set((state) => ({
        balances: state.balances.map(b => {
          if (b.currency === baseAsset) {
            return { ...b, locked: b.locked - quantity }
          }
          if (b.currency === 'GBP') {
            return { ...b, available: b.available + quoteAmount }
          }
          return b
        })
      }))
    }

    get().updatePortfolioValue()
  },

  cancelOrder: (orderId: string) => {
    const order = get().openOrders.find(o => o.id === orderId)
    if (!order) return

    const [baseAsset] = order.symbol.split('-')

    // Unlock funds
    if (order.side === 'buy') {
      const quoteAmount = order.price * order.quantity
      set((state) => ({
        balances: state.balances.map(b =>
          b.currency === 'GBP'
            ? { ...b, available: b.available + quoteAmount, locked: b.locked - quoteAmount }
            : b
        )
      }))
    } else {
      set((state) => ({
        balances: state.balances.map(b =>
          b.currency === baseAsset
            ? { ...b, available: b.available + order.quantity, locked: b.locked - order.quantity }
            : b
        )
      }))
    }

    // Move to cancelled
    set((state) => ({
      openOrders: state.openOrders.filter(o => o.id !== orderId),
      orderHistory: [{ ...order, status: 'cancelled' }, ...state.orderHistory]
    }))
  },

  addTrade: (trade: Trade) => {
    set((state) => ({
      tradeHistory: [trade, ...state.tradeHistory]
    }))
  },

  updatePortfolioValue: () => {
    // In production, this would fetch real prices and calculate total value
    // For now, just sum GBP + (crypto * prices)
    const state = get()
    const gbpBalance = state.getBalance('GBP')
    
    // Simple calculation - would use real prices in production
    let totalValue = gbpBalance
    
    set({ portfolioValue: totalValue })
  },

  reset: () => {
    set({
      balances: [
        { currency: 'GBP', available: 0.00, locked: 0.00 },
        { currency: 'BTC', available: 0.00, locked: 0.00 },
        { currency: 'ETH', available: 0.00, locked: 0.00 },
        { currency: 'SOL', available: 0.00, locked: 0.00 },
      ],
      openOrders: [],
      orderHistory: [],
      tradeHistory: [],
      portfolioValue: 0.00,
    })
  }
}))



