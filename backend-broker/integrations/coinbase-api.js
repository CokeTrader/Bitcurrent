/**
 * Coinbase Advanced Trade API Integration
 * Execute REAL trades through Coinbase
 */

const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

class CoinbaseAPI {
  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY;
    this.apiSecret = process.env.COINBASE_API_SECRET;
    this.baseUrl = 'https://api.coinbase.com/api/v3/brokerage';
  }

  /**
   * Generate API signature
   */
  generateSignature(timestamp, method, path, body = '') {
    const message = timestamp + method + path + body;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * Make authenticated API request
   */
  async request(method, path, body = null) {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(timestamp, method, path, bodyString);

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json'
        },
        data: body
      });

      return response.data;
    } catch (error) {
      logger.error('Coinbase API request failed', {
        path,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Place order on Coinbase
   */
  async placeOrder(orderData) {
    const { pair, side, amount, price, type } = orderData;

    const order = {
      product_id: pair.replace('/', '-'), // BTC/USD → BTC-USD
      side: side.toUpperCase(),
      order_configuration: type === 'market' ? {
        market_market_ioc: {
          [side === 'buy' ? 'quote_size' : 'base_size']: amount.toString()
        }
      } : {
        limit_limit_gtc: {
          base_size: amount.toString(),
          limit_price: price.toString()
        }
      }
    };

    const result = await this.request('POST', '/orders', order);

    logger.info('Coinbase order placed', {
      orderId: result.order_id,
      pair,
      side,
      amount
    });

    return {
      orderId: result.order_id,
      status: result.status,
      fillPrice: result.average_filled_price,
      exchange: 'coinbase'
    };
  }

  /**
   * Get order status
   */
  async getOrder(orderId) {
    return await this.request('GET', `/orders/${orderId}`);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    return await this.request('POST', `/orders/${orderId}/cancel`);
  }

  /**
   * Get account balances
   */
  async getBalances() {
    return await this.request('GET', '/accounts');
  }

  /**
   * Get product (pair) info
   */
  async getProduct(pair) {
    const productId = pair.replace('/', '-');
    return await this.request('GET', `/products/${productId}`);
  }
}

module.exports = new CoinbaseAPI();

