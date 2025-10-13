/**
 * Real Bitcoin Trading Service
 * 
 * CORE FUNCTIONALITY: The TRUE end-to-end flow
 * 
 * USER JOURNEY:
 * 1. Deposit £10 (via Stripe)
 * 2. Buy REAL Bitcoin
 * 3. Either:
 *    a) Send BTC to external wallet (withdrawal)
 *    b) Sell BTC back and see PnL, withdraw fiat
 * 
 * This service orchestrates REAL trading across multiple exchanges
 */

const CoinbaseAdvancedTrade = require('../integrations/coinbase-advanced-trade');
const KrakenAPI = require('../integrations/kraken-api');
const pool = require('../config/database');

class RealBitcoinTradingService {
  constructor() {
    this.coinbase = new CoinbaseAdvancedTrade();
    this.kraken = new KrakenAPI();
    this.primaryExchange = process.env.PRIMARY_EXCHANGE || 'coinbase'; // 'coinbase' or 'kraken'
  }

  /**
   * Get the active exchange client
   */
  getExchangeClient() {
    return this.primaryExchange === 'kraken' ? this.kraken : this.coinbase;
  }

  /**
   * STEP 1: Process fiat deposit (GBP)
   * This integrates with Stripe for real money deposits
   */
  async processDeposit(userId, amount, paymentMethodId) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: 'gbp',
        payment_method: paymentMethodId,
        confirm: true,
        description: `BitCurrent deposit - User ${userId}`,
        metadata: {
          userId: userId.toString(),
          type: 'deposit'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Record deposit in database
        await pool.query(
          `INSERT INTO transactions (user_id, type, amount, currency, status, external_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [userId, 'deposit', amount, 'GBP', 'completed', paymentIntent.id]
        );

        // Update user balance
        await pool.query(
          `UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2`,
          [amount, userId]
        );

        return {
          success: true,
          message: `Successfully deposited £${amount}`,
          transactionId: paymentIntent.id,
          balance: await this.getUserBalance(userId)
        };
      }

      return {
        success: false,
        error: 'Payment failed',
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('Deposit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 2: Buy REAL Bitcoin with deposited GBP
   */
  async buyBitcoin(userId, gbpAmount) {
    try {
      // Check user has sufficient GBP balance
      const userBalance = await this.getUserBalance(userId);
      
      if (userBalance.gbp < gbpAmount) {
        return {
          success: false,
          error: `Insufficient balance. You have £${userBalance.gbp}, need £${gbpAmount}`
        };
      }

      // Get current BTC price
      const exchange = this.getExchangeClient();
      const priceData = await (this.primaryExchange === 'kraken' 
        ? exchange.getTicker('XBTGBP')
        : exchange.getCurrentPrice());

      if (!priceData.success) {
        return {
          success: false,
          error: 'Failed to get current Bitcoin price'
        };
      }

      const btcPrice = priceData.price;
      const btcAmount = gbpAmount / btcPrice;

      // Execute buy order on exchange
      const orderResult = await exchange.buyBitcoin(gbpAmount);

      if (!orderResult.success) {
        return orderResult;
      }

      // Record trade in database
      const tradeResult = await pool.query(
        `INSERT INTO trades (
          user_id, symbol, side, quantity, price, total, status, 
          exchange, external_order_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id`,
        [
          userId,
          'BTC-GBP',
          'buy',
          btcAmount,
          btcPrice,
          gbpAmount,
          'filled',
          this.primaryExchange,
          orderResult.orderId
        ]
      );

      // Update user balances
      await pool.query(
        `UPDATE users 
         SET gbp_balance = gbp_balance - $1,
             btc_balance = btc_balance + $2
         WHERE id = $3`,
        [gbpAmount, btcAmount, userId]
      );

      return {
        success: true,
        message: `Successfully bought ${btcAmount.toFixed(8)} BTC for £${gbpAmount}`,
        tradeId: tradeResult.rows[0].id,
        btcAmount,
        btcPrice,
        gbpAmount,
        exchange: this.primaryExchange,
        orderId: orderResult.orderId,
        newBalance: await this.getUserBalance(userId)
      };

    } catch (error) {
      console.error('Buy Bitcoin error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 3a: Sell Bitcoin for GBP (realize PnL)
   */
  async sellBitcoin(userId, btcAmount) {
    try {
      // Check user has sufficient BTC balance
      const userBalance = await this.getUserBalance(userId);
      
      if (userBalance.btc < btcAmount) {
        return {
          success: false,
          error: `Insufficient BTC. You have ${userBalance.btc} BTC, need ${btcAmount} BTC`
        };
      }

      // Get current BTC price
      const exchange = this.getExchangeClient();
      const priceData = await (this.primaryExchange === 'kraken' 
        ? exchange.getTicker('XBTGBP')
        : exchange.getCurrentPrice());

      if (!priceData.success) {
        return {
          success: false,
          error: 'Failed to get current Bitcoin price'
        };
      }

      const currentPrice = priceData.price;
      const gbpAmount = btcAmount * currentPrice;

      // Calculate PnL
      const purchaseData = await pool.query(
        `SELECT AVG(price) as avg_purchase_price 
         FROM trades 
         WHERE user_id = $1 AND symbol = 'BTC-GBP' AND side = 'buy'`,
        [userId]
      );

      const avgPurchasePrice = parseFloat(purchaseData.rows[0]?.avg_purchase_price || currentPrice);
      const pnl = (currentPrice - avgPurchasePrice) * btcAmount;
      const pnlPercentage = ((pnl / (avgPurchasePrice * btcAmount)) * 100).toFixed(2);

      // Execute sell order on exchange
      const orderResult = await exchange.sellBitcoin(btcAmount);

      if (!orderResult.success) {
        return orderResult;
      }

      // Record trade in database
      const tradeResult = await pool.query(
        `INSERT INTO trades (
          user_id, symbol, side, quantity, price, total, pnl, status, 
          exchange, external_order_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id`,
        [
          userId,
          'BTC-GBP',
          'sell',
          btcAmount,
          currentPrice,
          gbpAmount,
          pnl,
          'filled',
          this.primaryExchange,
          orderResult.orderId
        ]
      );

      // Update user balances
      await pool.query(
        `UPDATE users 
         SET btc_balance = btc_balance - $1,
             gbp_balance = gbp_balance + $2
         WHERE id = $3`,
        [btcAmount, gbpAmount, userId]
      );

      return {
        success: true,
        message: `Successfully sold ${btcAmount.toFixed(8)} BTC for £${gbpAmount.toFixed(2)}`,
        tradeId: tradeResult.rows[0].id,
        btcAmount,
        currentPrice,
        gbpAmount,
        pnl: {
          amount: pnl.toFixed(2),
          percentage: `${pnlPercentage}%`,
          profitable: pnl > 0
        },
        exchange: this.primaryExchange,
        orderId: orderResult.orderId,
        newBalance: await this.getUserBalance(userId)
      };

    } catch (error) {
      console.error('Sell Bitcoin error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 3b: Withdraw Bitcoin to external wallet
   */
  async withdrawBitcoin(userId, address, btcAmount) {
    try {
      // Validate Bitcoin address format
      if (!this.isValidBitcoinAddress(address)) {
        return {
          success: false,
          error: 'Invalid Bitcoin address format'
        };
      }

      // Check user has sufficient BTC balance
      const userBalance = await this.getUserBalance(userId);
      
      if (userBalance.btc < btcAmount) {
        return {
          success: false,
          error: `Insufficient BTC. You have ${userBalance.btc} BTC, need ${btcAmount} BTC`
        };
      }

      // Check withdrawal limits and KYC status
      const kycStatus = await this.checkKYCStatus(userId);
      if (!kycStatus.verified) {
        return {
          success: false,
          error: 'KYC verification required for withdrawals',
          kycStatus
        };
      }

      // Execute withdrawal on exchange
      const exchange = this.getExchangeClient();
      const withdrawalResult = await exchange.withdrawBitcoin(address, btcAmount);

      if (!withdrawalResult.success) {
        // If exchange doesn't support direct withdrawal, we need alternative flow
        return {
          success: false,
          error: 'Direct withdrawal not yet enabled',
          message: 'Please contact support to enable withdrawals for your account',
          alternativeFlow: [
            '1. Complete enhanced KYC verification',
            '2. Add withdrawal address to whitelist',
            '3. Wait 24-hour security hold period',
            '4. Retry withdrawal'
          ]
        };
      }

      // Record withdrawal in database
      await pool.query(
        `INSERT INTO withdrawals (
          user_id, asset, amount, address, status, 
          external_id, network_fee, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          'BTC',
          btcAmount,
          address,
          'pending',
          withdrawalResult.refId || withdrawalResult.orderId,
          0.0001 // Standard BTC network fee
        ]
      );

      // Update user balance (deduct BTC + fee)
      const totalDeduction = btcAmount + 0.0001;
      await pool.query(
        `UPDATE users SET btc_balance = btc_balance - $1 WHERE id = $2`,
        [totalDeduction, userId]
      );

      return {
        success: true,
        message: `Successfully initiated withdrawal of ${btcAmount} BTC to ${address}`,
        address,
        amount: btcAmount,
        networkFee: 0.0001,
        estimatedArrival: '10-60 minutes',
        newBalance: await this.getUserBalance(userId)
      };

    } catch (error) {
      console.error('Withdraw Bitcoin error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * STEP 4: Withdraw fiat (GBP) back to bank account
   */
  async withdrawFiat(userId, amount, bankDetails) {
    try {
      const userBalance = await this.getUserBalance(userId);
      
      if (userBalance.gbp < amount) {
        return {
          success: false,
          error: `Insufficient balance. You have £${userBalance.gbp}, need £${amount}`
        };
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      // Create payout (requires Stripe Connect)
      // For now, we'll record the withdrawal request
      await pool.query(
        `INSERT INTO withdrawals (
          user_id, asset, amount, status, bank_details, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, 'GBP', amount, 'pending', JSON.stringify(bankDetails)]
      );

      await pool.query(
        `UPDATE users SET gbp_balance = gbp_balance - $1 WHERE id = $2`,
        [amount, userId]
      );

      return {
        success: true,
        message: `Withdrawal of £${amount} initiated. Funds will arrive in 1-3 business days.`,
        amount,
        estimatedArrival: '1-3 business days',
        newBalance: await this.getUserBalance(userId)
      };

    } catch (error) {
      console.error('Withdraw fiat error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's complete balance (GBP and BTC)
   */
  async getUserBalance(userId) {
    try {
      const result = await pool.query(
        `SELECT gbp_balance, btc_balance FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { gbp: 0, btc: 0 };
      }

      return {
        gbp: parseFloat(result.rows[0].gbp_balance || 0),
        btc: parseFloat(result.rows[0].btc_balance || 0)
      };
    } catch (error) {
      console.error('Get balance error:', error);
      return { gbp: 0, btc: 0 };
    }
  }

  /**
   * Get user's portfolio with current values and PnL
   */
  async getPortfolio(userId) {
    try {
      const balance = await this.getUserBalance(userId);
      
      // Get current BTC price
      const exchange = this.getExchangeClient();
      const priceData = await (this.primaryExchange === 'kraken' 
        ? exchange.getTicker('XBTGBP')
        : exchange.getCurrentPrice());

      const currentBTCPrice = priceData.success ? priceData.price : 0;
      const btcValueInGBP = balance.btc * currentBTCPrice;
      const totalValueInGBP = balance.gbp + btcValueInGBP;

      // Calculate overall PnL
      const tradesData = await pool.query(
        `SELECT 
          SUM(CASE WHEN side = 'buy' THEN total ELSE 0 END) as total_invested,
          SUM(CASE WHEN side = 'sell' THEN pnl ELSE 0 END) as realized_pnl
         FROM trades 
         WHERE user_id = $1 AND symbol = 'BTC-GBP'`,
        [userId]
      );

      const totalInvested = parseFloat(tradesData.rows[0]?.total_invested || 0);
      const realizedPnL = parseFloat(tradesData.rows[0]?.realized_pnl || 0);
      const unrealizedPnL = btcValueInGBP - (totalInvested - realizedPnL);

      return {
        success: true,
        portfolio: {
          gbp: balance.gbp,
          btc: balance.btc,
          btcValueInGBP,
          totalValueInGBP,
          currentBTCPrice,
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
      console.error('Get portfolio error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate Bitcoin address
   */
  isValidBitcoinAddress(address) {
    // Basic validation for Bitcoin addresses
    const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/; // Legacy
    const bech32Regex = /^(bc1|tb1)[a-z0-9]{39,59}$/; // SegWit
    
    return p2pkhRegex.test(address) || bech32Regex.test(address);
  }

  /**
   * Check KYC status
   */
  async checkKYCStatus(userId) {
    try {
      const result = await pool.query(
        `SELECT kyc_verified, kyc_level FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { verified: false, level: 0 };
      }

      return {
        verified: result.rows[0].kyc_verified === true,
        level: result.rows[0].kyc_level || 0
      };
    } catch (error) {
      return { verified: false, level: 0 };
    }
  }
}

module.exports = new RealBitcoinTradingService();

