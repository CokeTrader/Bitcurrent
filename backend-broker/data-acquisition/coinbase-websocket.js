/**
 * Coinbase Pro WebSocket Data Feed
 * Real-time market data acquisition
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');
const cache = require('../config/redis');

class CoinbaseWebSocketFeed {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
  }

  /**
   * Connect to Coinbase Pro WebSocket
   */
  connect() {
    this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

    this.ws.on('open', () => {
      logger.info('Coinbase WebSocket connected');
      this.reconnectAttempts = 0;

      // Subscribe to ticker for major pairs
      const subscribeMessage = {
        type: 'subscribe',
        product_ids: [
          'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOT-USD',
          'MATIC-USD', 'LINK-USD', 'UNI-USD', 'AVAX-USD', 'ATOM-USD',
          'XRP-USD', 'LTC-USD', 'BCH-USD', 'ALGO-USD', 'XLM-USD'
        ],
        channels: ['ticker', 'level2']
      };

      this.ws.send(JSON.stringify(subscribeMessage));
      logger.info('Subscribed to Coinbase market data');
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        logger.error('Failed to parse Coinbase message', { error: error.message });
      }
    });

    this.ws.on('error', (error) => {
      logger.error('Coinbase WebSocket error', { error: error.message });
    });

    this.ws.on('close', () => {
      logger.warn('Coinbase WebSocket disconnected');
      this.reconnect();
    });
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message) {
    if (message.type === 'ticker') {
      const priceData = {
        pair: message.product_id.replace('-', '/'),
        price: parseFloat(message.price),
        volume24h: parseFloat(message.volume_24h),
        bid: parseFloat(message.best_bid),
        ask: parseFloat(message.best_ask),
        lastSize: parseFloat(message.last_size),
        timestamp: new Date(message.time).getTime()
      };

      // Cache latest price (5 second TTL)
      await cache.set(`price:${priceData.pair}`, priceData, 5);

      // Broadcast to subscribers
      this.broadcast(priceData.pair, priceData);

      logger.debug('Price update received', {
        pair: priceData.pair,
        price: priceData.price
      });
    }

    if (message.type === 'l2update') {
      // Level 2 order book updates
      const pair = message.product_id.replace('-', '/');
      
      await cache.set(`orderbook:${pair}`, {
        changes: message.changes,
        timestamp: Date.now()
      }, 2);
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached for Coinbase WebSocket');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    logger.info('Reconnecting to Coinbase WebSocket', {
      attempt: this.reconnectAttempts,
      delay: `${delay}ms`
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to price updates for a pair
   */
  subscribe(pair, callback) {
    if (!this.subscribers.has(pair)) {
      this.subscribers.set(pair, new Set());
    }
    this.subscribers.get(pair).add(callback);
  }

  /**
   * Unsubscribe from price updates
   */
  unsubscribe(pair, callback) {
    if (this.subscribers.has(pair)) {
      this.subscribers.get(pair).delete(callback);
    }
  }

  /**
   * Broadcast price update to subscribers
   */
  broadcast(pair, data) {
    if (this.subscribers.has(pair)) {
      this.subscribers.get(pair).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Subscriber callback failed', { error: error.message });
        }
      });
    }
  }

  /**
   * Get latest cached price
   */
  async getLatestPrice(pair) {
    return await cache.get(`price:${pair}`);
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      logger.info('Coinbase WebSocket disconnected');
    }
  }
}

// Singleton instance
const coinbaseFeed = new CoinbaseWebSocketFeed();

// Auto-connect on import
coinbaseFeed.connect();

module.exports = coinbaseFeed;

