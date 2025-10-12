// Paper trading funds management (ONLY for paper mode)
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Grant paper trading funds to user (only works in paper mode)
router.post('/grant', verifyToken, async (req, res) => {
  try {
    if (process.env.ALPACA_PAPER !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Paper funds only available in paper trading mode'
      });
    }
    
    const { amount = 10000 } = req.body; // Default 10,000 GBP
    const userId = req.user.id;
    
    // Check if user already has paper funds
    const existing = await query(
      `SELECT balance FROM accounts WHERE user_id = $1 AND currency = 'GBP'`,
      [userId]
    );
    
    if (existing.rows.length > 0 && parseFloat(existing.rows[0].balance) > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have paper funds'
      });
    }
    
    // Create or update GBP account with paper funds
    await query(
      `INSERT INTO accounts (user_id, currency, balance, available, reserved)
       VALUES ($1, 'GBP', $2, $2, 0)
       ON CONFLICT (user_id, currency) 
       DO UPDATE SET balance = $2, available = $2, reserved = 0`,
      [userId, amount]
    );
    
    // Log the paper fund grant
    await query(
      `INSERT INTO transactions (user_id, currency, transaction_type, amount, status, description)
       VALUES ($1, 'GBP', 'paper_grant', $2, 'completed', 'Paper trading funds granted')`,
      [userId, amount]
    );
    
    res.json({
      success: true,
      message: `Granted £${amount.toLocaleString()} paper trading funds`,
      balance: amount
    });
    
  } catch (error) {
    console.error('Paper funds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant paper funds'
    });
  }
});

// Check paper funds status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT currency, balance, available, reserved
       FROM accounts WHERE user_id = $1`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      accounts: result.rows,
      paperMode: process.env.ALPACA_PAPER === 'true'
    });
    
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

module.exports = router;

