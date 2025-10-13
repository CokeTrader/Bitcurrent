/**
 * Kraken API Integration
 * 
 * Alternative exchange for real Bitcoin trading
 * - Excellent liquidity
 * - Supports GBP pairs
 * - Robust withdrawal system
 * 
 * Documentation: https://docs.kraken.com/rest/
 */

const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');

class KrakenAPI {
  constructor() {
    this.apiKey = process.env.KRAKEN_API_KEY;
    this.apiSecret = process.env.KRAKEN_API_SECRET;
    this.baseURL = 'https://api.kraken.com';
  }

  /**
   * Generate API signature for Kraken
   */
  generateSignature(path, data, nonce) {
    const message = querystring.stringify(data);
    const secret = Buffer.from(this.apiSecret, 'base64');
    const hash = crypto.createHash('sha256').update(nonce + message).digest();
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(path + hash);
    return hmac.digest('base64');
  }

  /**
   * Make authenticated API request
   */
  async makePrivateRequest(endpoint, data = {}) {
    const path = `/0/private/${endpoint}`;
    const nonce = Date.now() * 1000;
    
    const postData = {
      nonce,
      ...data
    };

    const signature = this.generateSignature(path, postData, nonce);

    try {
      const response = await axios.post(
        `${this.baseURL}${path}`,
        querystring.stringify(postData),
        {
          headers: {
            'API-Key': this.apiKey,
            'API-Sign': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.error && response.data.error.length > 0) {
        return {
          success: false,
          error: response.data.error.join(', ')
        };
      }

      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('Kraken API Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make public API request
   */
  async makePublicRequest(endpoint, params = {}) {
    try {
      const queryString = querystring.stringify(params);
      const url = `${this.baseURL}/0/public/${endpoint}${queryString ? '?' + queryString : ''}`;
      
      const response = await axios.get(url);

      if (response.data.error && response.data.error.length > 0) {
        return {
          success: false,
          error: response.data.error.join(', ')
        };
      }

      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('Kraken Public API Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    return await this.makePrivateRequest('Balance');
  }

  /**
   * Get current ticker information
   */
  async getTicker(pair = 'XBTGBP') {
    const result = await this.makePublicRequest('Ticker', { pair });
    
    if (result.success) {
      const ticker = result.data[pair];
      return {
        success: true,
        price: parseFloat(ticker.c[0]), // Last trade price
        bid: parseFloat(ticker.b[0]),
        ask: parseFloat(ticker.a[0]),
        volume24h: parseFloat(ticker.v[1]),
        low24h: parseFloat(ticker.l[1]),
        high24h: parseFloat(ticker.h[1])
      };
    }

    return result;
  }

  /**
   * Buy Bitcoin with GBP
   * @param {number} gbpAmount - Amount in GBP
   */
  async buyBitcoin(gbpAmount) {
    const orderData = {
      ordertype: 'market',
      type: 'buy',
      volume: gbpAmount, // Kraken will convert to BTC equivalent
      pair: 'XBTGBP'
    };

    const result = await this.makePrivateRequest('AddOrder', orderData);

    if (result.success) {
      return {
        success: true,
        orderId: result.data.txid[0],
        message: `Successfully bought Bitcoin with £${gbpAmount}`,
        details: result.data
      };
    }

    return result;
  }

  /**
   * Sell Bitcoin for GBP
   * @param {number} btcAmount - Amount in BTC
   */
  async sellBitcoin(btcAmount) {
    const orderData = {
      ordertype: 'market',
      type: 'sell',
      volume: btcAmount,
      pair: 'XBTGBP'
    };

    const result = await this.makePrivateRequest('AddOrder', orderData);

    if (result.success) {
      return {
        success: true,
        orderId: result.data.txid[0],
        message: `Successfully sold ${btcAmount} BTC`,
        details: result.data
      };
    }

    return result;
  }

  /**
   * Withdraw Bitcoin to external wallet
   * @param {string} address - Bitcoin wallet address
   * @param {number} amount - Amount of BTC to withdraw
   */
  async withdrawBitcoin(address, amount) {
    // First, add the withdrawal address (one-time setup)
    // Then initiate withdrawal
    
    const withdrawalData = {
      asset: 'XBT',
      key: address, // Must be pre-registered in Kraken
      amount: amount.toString()
    };

    const result = await this.makePrivateRequest('Withdraw', withdrawalData);

    if (result.success) {
      return {
        success: true,
        refId: result.data.refid,
        message: `Successfully initiated withdrawal of ${amount} BTC to ${address}`,
        details: result.data
      };
    }

    return result;
  }

  /**
   * Get open orders
   */
  async getOpenOrders() {
    return await this.makePrivateRequest('OpenOrders');
  }

  /**
   * Get closed orders
   */
  async getClosedOrders() {
    return await this.makePrivateRequest('ClosedOrders');
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    return await this.makePrivateRequest('CancelOrder', { txid: orderId });
  }

  /**
   * Get trading fees
   */
  async getTradeFees() {
    return await this.makePrivateRequest('TradeVolume', { pair: 'XBTGBP' });
  }
}

module.exports = KrakenAPI;
