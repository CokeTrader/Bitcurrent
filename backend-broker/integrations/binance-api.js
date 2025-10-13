/**
 * Binance API Integration
 * Execute REAL trades through Binance
 */

const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

class BinanceAPI {
  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY;
    this.apiSecret = process.env.BINANCE_API_SECRET;
    this.baseUrl = 'https://api.binance.com';
  }

  /**
   * Generate API signature
   */
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Make authenticated API request
   */
  async request(method, endpoint, params = {}) {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp }).toString();
    const signature = this.generateSignature(queryString);

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'X-MBX-APIKEY': this.apiKey
        },
        params: {
          ...params,
          timestamp,
          signature
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Binance API request failed', {
        endpoint,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Place order on Binance
   */
  async placeOrder(orderData) {
    const { pair, side, amount, price, type } = orderData;

    const params = {
      symbol: pair.replace('/', ''), // BTC/USD → BTCUSD
      side: side.toUpperCase(),
      type: type.toUpperCase(),
      quantity: amount
    };

    if (type === 'limit') {
      params.timeInForce = 'GTC';
      params.price = price;
    }

    const result = await this.request('POST', '/api/v3/order', params);

    logger.info('Binance order placed', {
      orderId: result.orderId,
      pair,
      side,
      amount
    });

    return {
      orderId: result.orderId.toString(),
      status: result.status,
      fillPrice: result.price,
      exchange: 'binance'
    };
  }

  /**
   * Get order status
   */
  async getOrder(orderId, symbol) {
    return await this.request('GET', '/api/v3/order', {
      symbol,
      orderId
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, symbol) {
    return await this.request('DELETE', '/api/v3/order', {
      symbol,
      orderId
    });
  }

  /**
   * Get account balances
   */
  async getBalances() {
    return await this.request('GET', '/api/v3/account');
  }

  /**
   * Get 24h ticker price
   */
  async getTicker(symbol) {
    const response = await axios.get(`${this.baseUrl}/api/v3/ticker/24hr`, {
      params: { symbol }
    });
    return response.data;
  }
}

module.exports = new BinanceAPI();

