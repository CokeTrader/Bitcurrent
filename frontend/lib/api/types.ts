// BitCurrent API Types

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  kyc_level: number
  status: 'active' | 'suspended' | 'banned'
  two_factor_enabled: boolean
  created_at: string
}

export interface AuthResponse {
  token: string
  refresh_token?: string
  user: User
}

export interface Market {
  symbol: string
  base_currency: string
  quote_currency: string
  min_order_size: string
  max_order_size: string
  price_precision: number
  quantity_precision: number
  maker_fee_bps: number
  taker_fee_bps: number
  status: 'active' | 'inactive'
}

export interface MarketStats {
  symbol: string
  last_price: string
  volume_24h: string
  high_24h: string
  low_24h: string
  price_change_24h: string
  price_change_percent_24h: string
  trades_count_24h: number
  timestamp: string
}

export interface OrderbookLevel {
  price: string
  quantity: string
}

export interface Orderbook {
  symbol: string
  bids: [string, string][]
  asks: [string, string][]
  timestamp: string
}

export interface Order {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  order_type: 'market' | 'limit' | 'stop'
  price?: string
  quantity: string
  filled_quantity: string
  status: 'new' | 'partial' | 'filled' | 'cancelled' | 'rejected'
  time_in_force?: 'GTC' | 'IOC' | 'FOK'
  post_only?: boolean
  created_at: string
  updated_at: string
}

export interface Balance {
  currency: string
  available: string
  locked: string
  total: string
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'trade'
  currency: string
  amount: string
  fee: string
  status: 'pending' | 'completed' | 'failed'
  timestamp: string
  details?: any
}

export interface PortfolioAsset {
  currency: string
  balance: string
  value_gbp: string
  price_gbp: string
  change_24h_percent: string
  allocation_percent: string
}

export interface Portfolio {
  total_value_gbp: string
  change_24h_gbp: string
  change_24h_percent: string
  assets: PortfolioAsset[]
}

export interface Trade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  price: string
  quantity: string
  timestamp: string
}

export interface Candle {
  timestamp: number
  open: string
  high: string
  low: string
  close: string
  volume: string
}

export interface KYCStatus {
  level: number
  status: 'pending' | 'approved' | 'rejected'
  submitted_at?: string
  reviewed_at?: string
  rejection_reason?: string
}

export interface Deposit {
  id: string
  currency: string
  amount: string
  status: 'pending' | 'confirmed' | 'failed'
  address?: string
  tx_hash?: string
  confirmations?: number
  created_at: string
}

export interface Withdrawal {
  id: string
  currency: string
  amount: string
  fee: string
  address: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  tx_hash?: string
  created_at: string
}

export interface Fee {
  symbol: string
  maker_fee_bps: number
  taker_fee_bps: number
  maker_fee_percent: string
  taker_fee_percent: string
}

export interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  created_at: string
  last_used_at?: string
}

// WebSocket Message Types
export interface WSTickerMessage {
  type: 'ticker'
  data: MarketStats
}

export interface WSOrderbookMessage {
  type: 'orderbook'
  data: Orderbook
}

export interface WSTradeMessage {
  type: 'trade'
  data: Trade
}

export interface WSOrderUpdateMessage {
  type: 'order_update'
  data: Order
}

export interface WSBalanceUpdateMessage {
  type: 'balance_update'
  data: Balance[]
}

export type WSMessage = 
  | WSTickerMessage
  | WSOrderbookMessage
  | WSTradeMessage
  | WSOrderUpdateMessage
  | WSBalanceUpdateMessage



