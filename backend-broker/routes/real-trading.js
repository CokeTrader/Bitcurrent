/**
 * Real Bitcoin Trading API Routes
 * 
 * THE COMPLETE END-TO-END FLOW:
 * 1. POST /api/real-trading/deposit - Deposit £10 via Stripe
 * 2. POST /api/real-trading/buy - Buy Bitcoin with GBP
 * 3. POST /api/real-trading/sell - Sell Bitcoin for GBP (see PnL)
 * 4. POST /api/real-trading/withdraw-btc - Withdraw BTC to external wallet
 * 5. POST /api/real-trading/withdraw-fiat - Withdraw GBP to bank account
 * 6. GET /api/real-trading/portfolio - Get complete portfolio with PnL
 */

const express = require('express');
const router = express.Router();
const realTradingService = require('../services/real-bitcoin-trading-service');
const { authenticateToken } = require('../middleware/api-auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/real-trading/portfolio
 * Get user's complete portfolio with PnL
 */
router.get('/portfolio', async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await realTradingService.getPortfolio(userId);
    
    res.json(portfolio);
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve portfolio'
    });
  }
});

/**
 * POST /api/real-trading/deposit
 * Deposit GBP via Stripe
 * Body: { amount: 10, paymentMethodId: "pm_..." }
 */
router.post('/deposit', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethodId } = req.body;

    // Validation
    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit is £10'
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method required'
      });
    }

    const result = await realTradingService.processDeposit(
      userId,
      amount,
      paymentMethodId
    );

    res.json(result);
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process deposit'
    });
  }
});

/**
 * POST /api/real-trading/buy
 * Buy Bitcoin with GBP
 * Body: { gbpAmount: 10 }
 */
router.post('/buy', async (req, res) => {
  try {
    const userId = req.user.id;
    const { gbpAmount } = req.body;

    // Validation
    if (!gbpAmount || gbpAmount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Minimum purchase is £1'
      });
    }

    const result = await realTradingService.buyBitcoin(userId, gbpAmount);

    res.json(result);
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to buy Bitcoin'
    });
  }
});

/**
 * POST /api/real-trading/sell
 * Sell Bitcoin for GBP (realize PnL)
 * Body: { btcAmount: 0.001 }
 */
router.post('/sell', async (req, res) => {
  try {
    const userId = req.user.id;
    const { btcAmount } = req.body;

    // Validation
    if (!btcAmount || btcAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid BTC amount'
      });
    }

    const result = await realTradingService.sellBitcoin(userId, btcAmount);

    res.json(result);
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sell Bitcoin'
    });
  }
});

/**
 * POST /api/real-trading/withdraw-btc
 * Withdraw Bitcoin to external wallet
 * Body: { address: "bc1...", btcAmount: 0.001 }
 */
router.post('/withdraw-btc', async (req, res) => {
  try {
    const userId = req.user.id;
    const { address, btcAmount } = req.body;

    // Validation
    if (!address || !btcAmount) {
      return res.status(400).json({
        success: false,
        error: 'Address and amount required'
      });
    }

    if (btcAmount < 0.0001) {
      return res.status(400).json({
        success: false,
        error: 'Minimum withdrawal is 0.0001 BTC'
      });
    }

    const result = await realTradingService.withdrawBitcoin(
      userId,
      address,
      btcAmount
    );

    res.json(result);
  } catch (error) {
    console.error('Withdraw BTC error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw Bitcoin'
    });
  }
});

/**
 * POST /api/real-trading/withdraw-fiat
 * Withdraw GBP to bank account
 * Body: { amount: 100, bankDetails: {...} }
 */
router.post('/withdraw-fiat', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankDetails } = req.body;

    // Validation
    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum withdrawal is £10'
      });
    }

    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        error: 'Bank details required'
      });
    }

    const result = await realTradingService.withdrawFiat(
      userId,
      amount,
      bankDetails
    );

    res.json(result);
  } catch (error) {
    console.error('Withdraw fiat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw funds'
    });
  }
});

/**
 * GET /api/real-trading/balance
 * Get user's current balances
 */
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await realTradingService.getUserBalance(userId);
    
    res.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve balance'
    });
  }
});

module.exports = router;

