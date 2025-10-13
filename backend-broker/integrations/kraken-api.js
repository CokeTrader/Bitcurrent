/**
 * Kraken API Integration
 * Execute REAL trades through Kraken
 */

const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

class KrakenAPI {
  constructor() {
    this.apiKey = process.env.KRAKEN_API_KEY;
    this.apiSecret = process.env.KRAKEN_API_SECRET;
    this.baseUrl = 'https://api.kraken.com';
  }

  /**
   * Generate API signature (Kraken-specific)
   */
  generateSignature(path, nonce, postData) {
    const message = path + crypto
      .createHash('sha256')
      .update(nonce + postData)
      .digest();

    return crypto
      .createHmac('sha512', Buffer.from(this.apiSecret, 'base64'))
      .update(message)
      .digest('base64');
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, params = {}) {
    const path = `/0/private/${endpoint}`;
    const nonce = Date.now() * 1000;
    const postData = new URLSearchParams({ ...params, nonce }).toString();
    const signature = this.generateSignature(path, nonce.toString(), postData);

    try {
      const response = await axios.post(`${this.baseUrl}${path}`, postData, {
        headers: {
          'API-Key': this.apiKey,
          'API-Sign': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(response.data.error.join(', '));
      }

      return response.data.result;
    } catch (error) {
      logger.error('Kraken API request failed', {
        endpoint,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Place order on Kraken
   */
  async placeOrder(orderData) {
    const { pair, side, amount, price, type } = orderData;

    const params = {
      pair: 'X' + pair.replace('/', ''), // BTC/USD → XBTCUSD
      type: side,
      ordertype: type,
      volume: amount.toString()
    };

    if (type === 'limit') {
      params.price = price.toString();
    }

    const result = await this.request('AddOrder', params);

    const orderId = result.txid[0];

    logger.info('Kraken order placed', {
      orderId,
      pair,
      side,
      amount
    });

    return {
      orderId,
      status: 'pending',
      fillPrice: price,
      exchange: 'kraken'
    };
  }

  /**
   * Get order status
   */
  async getOrder(orderId) {
    const result = await this.request('QueryOrders', {
      txid: orderId
    });
    return result[orderId];
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    return await this.request('CancelOrder', {
      txid: orderId
    });
  }

  /**
   * Get account balances
   */
  async getBalances() {
    return await this.request('Balance');
  }

  /**
   * Get ticker information
   */
  async getTicker(pair) {
    const response = await axios.get(`${this.baseUrl}/0/public/Ticker`, {
      params: { pair: 'X' + pair.replace('/', '') }
    });
    return response.data.result;
  }
}

module.exports = new KrakenAPI();

