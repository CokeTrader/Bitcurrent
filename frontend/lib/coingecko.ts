// CoinGecko API Integration
// Live cryptocurrency market data

const COINGECKO_API_KEY = 'CG-zYnaYNPafFEBwVto94yj17Ey'
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

interface CoinGeckoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  high_24h: number
  low_24h: number
  last_updated: string
}

interface CoinGeckoMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
}

class CoinGeckoService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = COINGECKO_API_KEY
    this.baseUrl = COINGECKO_BASE_URL
  }

  private async fetch(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add API key to headers
    const headers: HeadersInit = {
      'accept': 'application/json',
      'x-cg-demo-api-key': this.apiKey
    }

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString(), { headers })
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get current prices for multiple coins
  async getPrices(coinIds: string[], currency: string = 'gbp'): Promise<Record<string, number>> {
    const data = await this.fetch('/simple/price', {
      ids: coinIds.join(','),
      vs_currencies: currency,
      include_24hr_change: 'true'
    })
    return data
  }

  // Get detailed market data for coins
  async getMarkets(currency: string = 'gbp', coinIds?: string[]): Promise<CoinGeckoMarketData[]> {
    const params: Record<string, string> = {
      vs_currency: currency,
      order: 'market_cap_desc',
      per_page: '100',
      page: '1',
      sparkline: 'false',
      price_change_percentage: '24h'
    }

    if (coinIds && coinIds.length > 0) {
      params.ids = coinIds.join(',')
    }

    const data = await this.fetch('/coins/markets', params)
    return data
  }

  // Get specific coin data
  async getCoin(coinId: string): Promise<any> {
    const data = await this.fetch(`/coins/${coinId}`, {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false'
    })
    return data
  }

  // Get trending coins
  async getTrending(): Promise<any> {
    const data = await this.fetch('/search/trending')
    return data
  }

  // Map CoinGecko data to our market format
  mapToMarketData(cgData: CoinGeckoMarketData[]) {
    return cgData.map(coin => ({
      symbol: `${coin.symbol.toUpperCase()}-GBP`,
      baseAsset: coin.symbol.toUpperCase(),
      quoteAsset: 'GBP',
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      volume24h: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      name: coin.name,
      image: coin.image,
      marketCap: coin.market_cap,
      rank: coin.market_cap_rank
    }))
  }

  // Get live ticker data for homepage
  async getTickerData() {
    const coins = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'ripple']
    const markets = await this.getMarkets('gbp', coins)
    return this.mapToMarketData(markets)
  }

  // Get orderbook simulation (CoinGecko doesn't provide this, so we simulate)
  async getSimulatedOrderbook(coinId: string, basePrice: number) {
    // Generate realistic orderbook based on current price
    const spread = basePrice * 0.001 // 0.1% spread
    
    const bids = Array.from({ length: 20 }, (_, i) => {
      const price = basePrice - (spread + i * (basePrice * 0.0005))
      const quantity = Math.random() * 2 + 0.1
      return {
        price: price.toFixed(2),
        quantity: quantity.toFixed(8),
        total: (price * quantity).toFixed(2)
      }
    })

    const asks = Array.from({ length: 20 }, (_, i) => {
      const price = basePrice + (spread + i * (basePrice * 0.0005))
      const quantity = Math.random() * 2 + 0.1
      return {
        price: price.toFixed(2),
        quantity: quantity.toFixed(8),
        total: (price * quantity).toFixed(2)
      }
    })

    return {
      bids,
      asks,
      spread: (spread * 2).toFixed(2),
      spreadPercentage: 0.1
    }
  }
}

export const coinGeckoService = new CoinGeckoService()

// Export types
export type { CoinGeckoMarketData, CoinGeckoPrice }



