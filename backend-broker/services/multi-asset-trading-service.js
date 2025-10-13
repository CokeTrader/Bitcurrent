/**
 * Multi-Asset Trading Service
 * 
 * Expand beyond Bitcoin to support:
 * - Ethereum (ETH)
 * - Solana (SOL)
 * - And more cryptocurrencies
 * 
 * All with the same complete flow:
 * Deposit £ → Buy Asset → Withdraw or Sell with PnL
 */

const CoinbaseAdvancedTrade = require('../integrations/coinbase-advanced-trade');
const KrakenAPI = require('../integrations/kraken-api');
const pool = require('../config/database');

class MultiAssetTradingService {
  constructor() {
    this.coinbase = new CoinbaseAdvancedTrade();
    this.kraken = new KrakenAPI();
    this.primaryExchange = process.env.PRIMARY_EXCHANGE || 'coinbase';
    
    // Supported assets with their trading pairs
    this.supportedAssets = {
      BTC: {
        name: 'Bitcoin',
        symbol: 'BTC',
        pair: 'BTC-GBP',
        krakenPair: 'XBTGBP',
        decimals: 8,
        minWithdrawal: 0.0001
      },
      ETH: {
        name: 'Ethereum',
        symbol: 'ETH',
        pair: 'ETH-GBP',
        krakenPair: 'ETHGBP',
        decimals: 8,
        minWithdrawal: 0.01
      },
      SOL: {
        name: 'Solana',
        symbol: 'SOL',
        pair: 'SOL-GBP',
        krakenPair: 'SOLGBP',
        decimals: 8,
        minWithdrawal: 0.1
      },
      ADA: {
        name: 'Cardano',
        symbol: 'ADA',
        pair: 'ADA-GBP',
        krakenPair: 'ADAGBP',
        decimals: 6,
        minWithdrawal: 10
      },
      DOT: {
        name: 'Polkadot',
        symbol: 'DOT',
        pair: 'DOT-GBP',
        krakenPair: 'DOTGBP',
        decimals: 8,
        minWithdrawal: 1
      }
    };
  }

  /**
   * Get asset configuration
   */
  getAssetConfig(symbol) {
    const asset = this.supportedAssets[symbol.toUpperCase()];
    if (!asset) {
      throw new Error(`Unsupported asset: ${symbol}`);
    }
    return asset;
  }

  /**
   * Get all supported assets
   */
  getSupportedAssets() {
    return Object.values(this.supportedAssets);
  }

  /**
   * Buy cryptocurrency with GBP
   * @param {number} userId - User ID
   * @param {string} symbol - Asset symbol (BTC, ETH, SOL, etc.)
   * @param {number} gbpAmount - Amount in GBP
   */
  async buyAsset(userId, symbol, gbpAmount) {
    try {
      const asset = this.getAssetConfig(symbol);
      
      // Check user has sufficient GBP balance
      const userBalance = await this.getUserBalance(userId);
      
      if (userBalance.gbp < gbpAmount) {
        return {
          success: false,
          error: `Insufficient balance. You have £${userBalance.gbp}, need £${gbpAmount}`
        };
      }

      // Get current price
      const priceData = await this.getAssetPrice(symbol);
      
      if (!priceData.success) {
        return {
          success: false,
          error: `Failed to get ${asset.name} price`
        };
      }

      const price = priceData.price;
      const amount = gbpAmount / price;

      // Execute buy order on exchange (placeholder - would use real exchange API)
      // For now, simulate successful order
      const orderId = `order_${Date.now()}_${symbol}`;

      // Record trade in database
      const tradeResult = await pool.query(
        `INSERT INTO trades (
          user_id, symbol, side, quantity, price, total, status, 
          exchange, external_order_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id`,
        [
          userId,
          `${symbol}-GBP`,
          'buy',
          amount,
          price,
          gbpAmount,
          'filled',
          this.primaryExchange,
          orderId
        ]
      );

      // Update user balances
      await pool.query(
        `UPDATE users 
         SET gbp_balance = gbp_balance - $1,
             ${symbol.toLowerCase()}_balance = ${symbol.toLowerCase()}_balance + $2
         WHERE id = $3`,
        [gbpAmount, amount, userId]
      );

      return {
        success: true,
        message: `Successfully bought ${amount.toFixed(asset.decimals)} ${symbol} for £${gbpAmount}`,
        tradeId: tradeResult.rows[0].id,
        amount,
        price,
        gbpAmount,
        asset: symbol,
        exchange: this.primaryExchange,
        orderId,
        newBalance: await this.getUserBalance(userId)
      };

    } catch (error) {
      console.error(`Buy ${symbol} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sell cryptocurrency for GBP
   * @param {number} userId - User ID
   * @param {string} symbol - Asset symbol
   * @param {number} amount - Amount of asset to sell
   */
  async sellAsset(userId, symbol, amount) {
    try {
      const asset = this.getAssetConfig(symbol);
      
      // Check user has sufficient balance
      const userBalance = await this.getUserBalance(userId);
      const balanceKey = `${symbol.toLowerCase()}`;
      
      if (userBalance[balanceKey] < amount) {
        return {
          success: false,
          error: `Insufficient ${symbol} balance. You have ${userBalance[balanceKey]} ${symbol}, need ${amount} ${symbol}`
        };
      }

      // Get current price
      const priceData = await this.getAssetPrice(symbol);
      
      if (!priceData.success) {
        return {
          success: false,
          error: `Failed to get ${asset.name} price`
        };
      }

      const currentPrice = priceData.price;
      const gbpAmount = amount * currentPrice;

      // Calculate PnL
      const purchaseData = await pool.query(
        `SELECT AVG(price) as avg_purchase_price 
         FROM trades 
         WHERE user_id = $1 AND symbol = $2 AND side = 'buy'`,
        [userId, `${symbol}-GBP`]
      );

      const avgPurchasePrice = parseFloat(purchaseData.rows[0]?.avg_purchase_price || currentPrice);
      const pnl = (currentPrice - avgPurchasePrice) * amount;
      const pnlPercentage = ((pnl / (avgPurchasePrice * amount)) * 100).toFixed(2);

      // Execute sell order (placeholder)
      const orderId = `order_${Date.now()}_${symbol}`;

      // Record trade in database
      const tradeResult = await pool.query(
        `INSERT INTO trades (
          user_id, symbol, side, quantity, price, total, pnl, status, 
          exchange, external_order_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id`,
        [
          userId,
          `${symbol}-GBP`,
          'sell',
          amount,
          currentPrice,
          gbpAmount,
          pnl,
          'filled',
          this.primaryExchange,
          orderId
        ]
      );

      // Update user balances
      await pool.query(
        `UPDATE users 
         SET ${symbol.toLowerCase()}_balance = ${symbol.toLowerCase()}_balance - $1,
             gbp_balance = gbp_balance + $2
         WHERE id = $3`,
        [amount, gbpAmount, userId]
      );

      return {
        success: true,
        message: `Successfully sold ${amount.toFixed(asset.decimals)} ${symbol} for £${gbpAmount.toFixed(2)}`,
        tradeId: tradeResult.rows[0].id,
        amount,
        currentPrice,
        gbpAmount,
        pnl: {
          amount: pnl.toFixed(2),
          percentage: `${pnlPercentage}%`,
          profitable: pnl > 0
        },
        asset: symbol,
        exchange: this.primaryExchange,
        orderId,
        newBalance: await this.getUserBalance(userId)
      };

    } catch (error) {
      console.error(`Sell ${symbol} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current price for an asset
   */
  async getAssetPrice(symbol) {
    try {
      const asset = this.getAssetConfig(symbol);
      
      // Use Coinbase by default
      if (symbol === 'BTC') {
        return await this.coinbase.getCurrentPrice();
      }
      
      // For other assets, simulate pricing (in production, use real API)
      // Placeholder prices
      const placeholderPrices = {
        ETH: 2500,
        SOL: 100,
        ADA: 0.50,
        DOT: 7.50
      };

      return {
        success: true,
        price: placeholderPrices[symbol] || 1,
        volume24h: 0,
        priceChange24h: 0
      };

    } catch (error) {
      console.error(`Get ${symbol} price error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's complete balance (all assets)
   */
  async getUserBalance(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          gbp_balance,
          btc_balance,
          eth_balance,
          sol_balance,
          ada_balance,
          dot_balance
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          gbp: 0,
          btc: 0,
          eth: 0,
          sol: 0,
          ada: 0,
          dot: 0
        };
      }

      const balance = result.rows[0];
      return {
        gbp: parseFloat(balance.gbp_balance || 0),
        btc: parseFloat(balance.btc_balance || 0),
        eth: parseFloat(balance.eth_balance || 0),
        sol: parseFloat(balance.sol_balance || 0),
        ada: parseFloat(balance.ada_balance || 0),
        dot: parseFloat(balance.dot_balance || 0)
      };
    } catch (error) {
      console.error('Get balance error:', error);
      return {
        gbp: 0,
        btc: 0,
        eth: 0,
        sol: 0,
        ada: 0,
        dot: 0
      };
    }
  }

  /**
   * Get user's complete portfolio with values and PnL for all assets
   */
  async getMultiAssetPortfolio(userId) {
    try {
      const balances = await this.getUserBalance(userId);
      
      // Get current prices for all assets
      const prices = {};
      for (const symbol of Object.keys(this.supportedAssets)) {
        const priceData = await this.getAssetPrice(symbol);
        prices[symbol] = priceData.success ? priceData.price : 0;
      }

      // Calculate values
      const assetValues = {};
      let totalValueInGBP = balances.gbp;

      for (const symbol of Object.keys(this.supportedAssets)) {
        const balanceKey = symbol.toLowerCase();
        const balance = balances[balanceKey] || 0;
        const value = balance * prices[symbol];
        assetValues[symbol] = {
          balance,
          price: prices[symbol],
          value
        };
        totalValueInGBP += value;
      }

      // Calculate overall PnL
      const tradesData = await pool.query(
        `SELECT 
          SUM(CASE WHEN side = 'buy' THEN total ELSE 0 END) as total_invested,
          SUM(CASE WHEN side = 'sell' THEN pnl ELSE 0 END) as realized_pnl
         FROM trades 
         WHERE user_id = $1`,
        [userId]
      );

      const totalInvested = parseFloat(tradesData.rows[0]?.total_invested || 0);
      const realizedPnL = parseFloat(tradesData.rows[0]?.realized_pnl || 0);
      const unrealizedPnL = (totalValueInGBP - balances.gbp) - (totalInvested - realizedPnL);

      return {
        success: true,
        portfolio: {
          gbp: balances.gbp,
          assets: assetValues,
          totalValueInGBP,
          pnl: {
            realized: realizedPnL,
            unrealized: unrealizedPnL,
            total: realizedPnL + unrealizedPnL,
            percentage: totalInvested > 0 
              ? ((realizedPnL + unrealizedPnL) / totalInvested * 100).toFixed(2) + '%'
              : '0%'
          }
        }
      };

    } catch (error) {
      console.error('Get multi-asset portfolio error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all prices for supported assets
   */
  async getAllPrices() {
    const prices = {};
    
    for (const [symbol, config] of Object.entries(this.supportedAssets)) {
      const priceData = await this.getAssetPrice(symbol);
      prices[symbol] = {
        ...config,
        price: priceData.success ? priceData.price : 0,
        volume24h: priceData.volume24h || 0,
        priceChange24h: priceData.priceChange24h || 0
      };
    }

    return {
      success: true,
      prices
    };
  }
}

module.exports = new MultiAssetTradingService();

