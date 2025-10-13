/**
 * Binance WebSocket Data Feed
 * Real-time market data from largest exchange
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');
const cache = require('../config/redis');

class BinanceWebSocketFeed {
  constructor() {
    this.ws = null;
    this.streams = [];
  }

  /**
   * Connect to Binance WebSocket
   */
  connect() {
    // Binance combined streams
    const symbols = [
      'btcusdt', 'ethusdt', 'solusdt', 'adausdt', 'dotusdt',
      'maticusdt', 'linkusdt', 'uniusdt', 'avaxusdt', 'atomusdt',
      'xrpusdt', 'ltcusdt', 'bchusdt', 'algousdt', 'xlmusdt',
      'dogeusdt', 'shibusdt', 'aptusdt', 'arbusdt', 'opusdt'
    ];

    const streamNames = symbols.map(s => `${s}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      logger.info('Binance WebSocket connected', { symbols: symbols.length });
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.data) {
          this.handleTicker(message.data);
        }
      } catch (error) {
        logger.error('Failed to parse Binance message', { error: error.message });
      }
    });

    this.ws.on('error', (error) => {
      logger.error('Binance WebSocket error', { error: error.message });
    });

    this.ws.on('close', () => {
      logger.warn('Binance WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  /**
   * Handle ticker update
   */
  async handleTicker(ticker) {
    const symbol = ticker.s.toUpperCase();
    const pair = this.formatPair(symbol);

    const priceData = {
      pair,
      price: parseFloat(ticker.c), // Close price
      change24h: parseFloat(ticker.P), // Price change percent
      volume24h: parseFloat(ticker.v), // Volume
      high24h: parseFloat(ticker.h),
      low24h: parseFloat(ticker.l),
      bid: parseFloat(ticker.b),
      ask: parseFloat(ticker.a),
      trades24h: parseInt(ticker.n),
      timestamp: ticker.E
    };

    // Cache for 3 seconds (Binance updates are frequent)
    await cache.set(`binance:${pair}`, priceData, 3);

    logger.debug('Binance price update', {
      pair,
      price: priceData.price,
      change24h: priceData.change24h
    });
  }

  /**
   * Format symbol to pair (BTCUSDT → BTC/USD)
   */
  formatPair(symbol) {
    // Remove USDT suffix
    const base = symbol.replace('USDT', '');
    return `${base}/USD`;
  }

  /**
   * Get aggregated price from multiple sources
   */
  static async getAggregatedPrice(pair) {
    const sources = [
      await cache.get(`price:${pair}`), // Coinbase
      await cache.get(`binance:${pair}`), // Binance
      await cache.get(`kraken:${pair}`) // Kraken
    ].filter(Boolean);

    if (sources.length === 0) return null;

    // Calculate median price (more robust than average)
    const prices = sources.map(s => s.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];

    return {
      pair,
      price: median,
      sources: sources.length,
      spread: Math.max(...prices) - Math.min(...prices),
      timestamp: Date.now()
    };
  }
}

const binanceFeed = new BinanceWebSocketFeed();
binanceFeed.connect();

module.exports = binanceFeed;

