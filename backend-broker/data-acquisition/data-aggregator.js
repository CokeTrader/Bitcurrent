/**
 * Multi-Source Data Aggregator
 * Aggregate real-time data from multiple exchanges
 */

const logger = require('../utils/logger');
const cache = require('../config/redis');
const coinbaseFeed = require('./coinbase-websocket');
const binanceFeed = require('./binance-websocket');

class DataAggregator {
  constructor() {
    this.sources = ['coinbase', 'binance', 'kraken'];
    this.priceCache = new Map();
  }

  /**
   * Get best price from multiple sources
   */
  async getBestPrice(pair, side = 'buy') {
    const prices = await Promise.all([
      cache.get(`price:${pair}`),
      cache.get(`binance:${pair}`),
      cache.get(`kraken:${pair}`)
    ]);

    const validPrices = prices.filter(Boolean);

    if (validPrices.length === 0) {
      throw new Error('No price data available');
    }

    // For buy orders, use lowest ask
    // For sell orders, use highest bid
    if (side === 'buy') {
      const asks = validPrices.map(p => p.ask || p.price).filter(Boolean);
      return {
        price: Math.min(...asks),
        source: 'aggregated',
        sources: validPrices.length,
        timestamp: Date.now()
      };
    } else {
      const bids = validPrices.map(p => p.bid || p.price).filter(Boolean);
      return {
        price: Math.max(...bids),
        source: 'aggregated',
        sources: validPrices.length,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get aggregated market data
   */
  async getAggregatedMarketData(pair) {
    const prices = await Promise.all([
      cache.get(`price:${pair}`),
      cache.get(`binance:${pair}`),
      cache.get(`kraken:${pair}`)
    ]);

    const validPrices = prices.filter(Boolean);

    if (validPrices.length === 0) return null;

    // Calculate volume-weighted average price (VWAP)
    const totalVolume = validPrices.reduce((sum, p) => sum + (p.volume24h || 0), 0);
    const vwap = validPrices.reduce((sum, p) => 
      sum + (p.price * (p.volume24h || 0)), 0) / totalVolume;

    // Calculate spread
    const allBids = validPrices.map(p => p.bid).filter(Boolean);
    const allAsks = validPrices.map(p => p.ask).filter(Boolean);
    const bestBid = Math.max(...allBids);
    const bestAsk = Math.min(...allAsks);
    const spread = ((bestAsk - bestBid) / bestBid) * 100;

    return {
      pair,
      price: vwap,
      bestBid,
      bestAsk,
      spread: spread.toFixed(4) + '%',
      volume24h: totalVolume,
      high24h: Math.max(...validPrices.map(p => p.high24h || 0)),
      low24h: Math.min(...validPrices.map(p => p.low24h || Infinity)),
      sources: validPrices.length,
      timestamp: Date.now()
    };
  }

  /**
   * Store tick data for historical analysis
   */
  async storeTickData(pair, price, volume) {
    const key = `tick:${pair}:${Date.now()}`;
    
    await cache.set(key, {
      price,
      volume,
      timestamp: Date.now()
    }, 3600); // 1 hour TTL

    // Also append to time-series (for charting)
    const timeSeriesKey = `timeseries:${pair}`;
    const tick = JSON.stringify({ price, volume, timestamp: Date.now() });
    
    // Keep last 1000 ticks in Redis
    await cache.client?.lPush(timeSeriesKey, tick);
    await cache.client?.lTrim(timeSeriesKey, 0, 999);
  }

  /**
   * Get historical tick data for charting
   */
  async getTickData(pair, limit = 100) {
    const timeSeriesKey = `timeseries:${pair}`;
    const ticks = await cache.client?.lRange(timeSeriesKey, 0, limit - 1);
    
    return ticks?.map(t => JSON.parse(t)) || [];
  }

  /**
   * Calculate market statistics
   */
  async calculateMarketStats() {
    const pairs = [
      'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD'
    ];

    const stats = [];

    for (const pair of pairs) {
      const data = await this.getAggregatedMarketData(pair);
      if (data) {
        stats.push(data);
      }
    }

    // Calculate total market stats
    const totalVolume = stats.reduce((sum, s) => sum + s.volume24h, 0);
    const avgSpread = stats.reduce((sum, s) => sum + parseFloat(s.spread), 0) / stats.length;

    return {
      pairs: stats,
      totalVolume,
      avgSpread: avgSpread.toFixed(4) + '%',
      activeSources: this.sources.length,
      timestamp: Date.now()
    };
  }

  /**
   * Health check
   */
  isHealthy() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      logger.info('Data aggregator disconnected');
    }
  }
}

// Singleton
const dataAggregator = new DataAggregator();

module.exports = dataAggregator;

