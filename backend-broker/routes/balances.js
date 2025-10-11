// Balances routes
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const ledger = require('../services/ledger');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * GET /balances
 * Get all user balances
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const balances = await ledger.getAllBalances(userId);
    
    res.json({
      success: true,
      balances
    });
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balances'
    });
  }
});

/**
 * GET /balances/:currency
 * Get specific currency balance
 */
router.get('/:currency', async (req, res) => {
  try {
    const userId = req.user.id;
    const currency = req.params.currency.toUpperCase();
    
    const balance = await ledger.getBalance(userId, currency);
    
    res.json({
      success: true,
      currency,
      balance
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance'
    });
  }
});

/**
 * GET /balances/transactions/history
 * Get transaction history
 */
router.get('/transactions/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await ledger.getTransactionHistory(userId, limit, offset);
    
    res.json({
      success: true,
      transactions,
      pagination: {
        limit,
        offset,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history'
    });
  }
});

module.exports = router;

