/**
 * Coinbase Advanced Trade API Integration
 * 
 * REAL Bitcoin Trading Integration
 * - Buy/Sell Bitcoin with GBP
 * - Withdraw BTC to external wallets
 * - Real-time balance and PnL tracking
 * 
 * Documentation: https://docs.cloud.coinbase.com/advanced-trade-api/docs
 */

const crypto = require('crypto');
const axios = require('axios');

class CoinbaseAdvancedTrade {
  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY;
    this.apiSecret = process.env.COINBASE_API_SECRET;
    this.baseURL = 'https://api.coinbase.com/api/v3/brokerage';
  }

  /**
   * Generate authentication signature for Coinbase API
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
  async makeRequest(method, endpoint, data = null) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = endpoint;
    const body = data ? JSON.stringify(data) : '';
    
    const signature = this.generateSignature(timestamp, method, path, body);

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'CB-ACCESS-KEY': this.apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Coinbase API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get user's account balances
   */
  async getAccounts() {
    return await this.makeRequest('GET', '/accounts');
  }

  /**
   * Get specific asset balance (e.g., BTC, GBP)
   */
  async getBalance(currency = 'BTC') {
    const accounts = await this.getAccounts();
    
    if (!accounts.success) {
      return { success: false, balance: 0 };
    }

    const account = accounts.data.accounts.find(
      acc => acc.currency === currency
    );

    return {
      success: true,
      balance: account ? parseFloat(account.available_balance.value) : 0,
      currency
    };
  }

  /**
   * Buy Bitcoin with GBP (Market Order)
   * @param {number} gbpAmount - Amount in GBP (e.g., 10 for £10)
   */
  async buyBitcoin(gbpAmount) {
    // Create market buy order
    const orderData = {
      client_order_id: `buy_${Date.now()}`,
      product_id: 'BTC-GBP',
      side: 'BUY',
      order_configuration: {
        market_market_ioc: {
          quote_size: gbpAmount.toString()
        }
      }
    };

    const result = await this.makeRequest('POST', '/orders', orderData);

    if (result.success) {
      return {
        success: true,
        orderId: result.data.success_response.order_id,
        message: `Successfully bought Bitcoin with £${gbpAmount}`,
        details: result.data
      };
    }

    return result;
  }

  /**
   * Sell Bitcoin for GBP (Market Order)
   * @param {number} btcAmount - Amount in BTC (e.g., 0.001)
   */
  async sellBitcoin(btcAmount) {
    const orderData = {
      client_order_id: `sell_${Date.now()}`,
      product_id: 'BTC-GBP',
      side: 'SELL',
      order_configuration: {
        market_market_ioc: {
          base_size: btcAmount.toString()
        }
      }
    };

    const result = await this.makeRequest('POST', '/orders', orderData);

    if (result.success) {
      return {
        success: true,
        orderId: result.data.success_response.order_id,
        message: `Successfully sold ${btcAmount} BTC`,
        details: result.data
      };
    }

    return result;
  }

  /**
   * Get current BTC-GBP price
   */
  async getCurrentPrice() {
    const result = await this.makeRequest('GET', '/products/BTC-GBP');
    
    if (result.success) {
      return {
        success: true,
        price: parseFloat(result.data.price),
        volume24h: parseFloat(result.data.volume_24h),
        priceChange24h: parseFloat(result.data.price_percentage_change_24h)
      };
    }

    return result;
  }

  /**
   * Get order details
   */
  async getOrder(orderId) {
    return await this.makeRequest('GET', `/orders/historical/${orderId}`);
  }

  /**
   * Get all orders
   */
  async getOrders(limit = 10) {
    return await this.makeRequest('GET', `/orders/historical/batch?limit=${limit}`);
  }

  /**
   * Calculate PnL for a position
   * @param {number} purchasePrice - Price at which BTC was purchased
   * @param {number} currentPrice - Current BTC price
   * @param {number} amount - Amount of BTC held
   */
  calculatePnL(purchasePrice, currentPrice, amount) {
    const initialValue = purchasePrice * amount;
    const currentValue = currentPrice * amount;
    const pnl = currentValue - initialValue;
    const pnlPercentage = ((pnl / initialValue) * 100).toFixed(2);

    return {
      initialValue,
      currentValue,
      pnl,
      pnlPercentage: `${pnlPercentage}%`,
      profitable: pnl > 0
    };
  }

  /**
   * Withdraw Bitcoin to external wallet
   * @param {string} address - External Bitcoin wallet address
   * @param {number} amount - Amount of BTC to withdraw
   */
  async withdrawBitcoin(address, amount) {
    // Note: Coinbase Advanced Trade API withdrawal endpoints
    // For production, you'd use: POST /v2/accounts/:account_id/transactions
    
    const withdrawalData = {
      type: 'send',
      to: address,
      amount: amount.toString(),
      currency: 'BTC'
    };

    // This would require Coinbase Wallet API, not Advanced Trade API
    // For now, returning structure for implementation
    return {
      success: false,
      message: 'Withdrawal requires Coinbase Wallet API integration',
      nextSteps: [
        '1. Integrate Coinbase Wallet API',
        '2. Complete KYC verification',
        '3. Enable withdrawals in Coinbase account settings',
        '4. Verify wallet address before withdrawal'
      ],
      withdrawalData
    };
  }

  /**
   * Get trading fees
   */
  async getTradingFees() {
    return await this.makeRequest('GET', '/transaction_summary');
  }
}

module.exports = CoinbaseAdvancedTrade;

