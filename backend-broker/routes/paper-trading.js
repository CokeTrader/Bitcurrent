// Paper Trading Account Management Routes
const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// All routes require authentication
router.use(verifyToken);

/**
 * GET /paper-trading/accounts
 * Get all paper trading accounts for the current user
 */
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT id, name, initial_balance, current_balance, created_at, is_active
       FROM paper_trading_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      accounts: result.rows,
      count: result.rows.length,
      maxAccounts: 2
    });
    
  } catch (error) {
    console.error('Get paper accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get paper trading accounts'
    });
  }
});

/**
 * POST /paper-trading/accounts
 * Create a new paper trading account
 */
router.post('/accounts', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, initialBalance = 10000 } = req.body;
    
    // Validate initial balance
    if (initialBalance < 100 || initialBalance > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Initial balance must be between £100 and £100,000'
      });
    }
    
    // Check if user already has 2 accounts
    const existingAccounts = await query(
      'SELECT COUNT(*) FROM paper_trading_accounts WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (parseInt(existingAccounts.rows[0].count) >= 2) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 2 active paper trading accounts allowed. Please delete one first.'
      });
    }
    
    // Create paper trading account
    const accountId = uuidv4();
    const accountName = name || `Paper Account ${parseInt(existingAccounts.rows[0].count) + 1}`;
    
    await query(
      `INSERT INTO paper_trading_accounts (id, user_id, name, initial_balance, current_balance, is_active)
       VALUES ($1, $2, $3, $4, $4, true)`,
      [accountId, userId, accountName, initialBalance]
    );
    
    // Create initial GBP balance in accounts table with paper prefix
    await query(
      `INSERT INTO accounts (user_id, currency, balance, available, reserved)
       VALUES ($1, $2, $3, $3, 0)
       ON CONFLICT (user_id, currency) DO UPDATE 
       SET balance = accounts.balance + $3, available = accounts.available + $3`,
      [userId, `PAPER_${accountId}_GBP`, initialBalance]
    );
    
    res.json({
      success: true,
      message: 'Paper trading account created successfully',
      account: {
        id: accountId,
        name: accountName,
        initialBalance,
        currentBalance: initialBalance,
        isActive: true
      }
    });
    
  } catch (error) {
    console.error('Create paper account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create paper trading account'
    });
  }
});

/**
 * DELETE /paper-trading/accounts/:id
 * Delete a paper trading account
 */
router.delete('/accounts/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    
    // Verify ownership and delete
    const result = await query(
      'UPDATE paper_trading_accounts SET is_active = false, deleted_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id, name',
      [accountId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paper trading account not found or already deleted'
      });
    }
    
    res.json({
      success: true,
      message: `Paper trading account "${result.rows[0].name}" deleted successfully`
    });
    
  } catch (error) {
    console.error('Delete paper account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete paper trading account'
    });
  }
});

/**
 * POST /paper-trading/accounts/:id/reset
 * Reset a paper trading account to initial balance
 */
router.post('/accounts/:id/reset', async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    
    const result = await query(
      `UPDATE paper_trading_accounts 
       SET current_balance = initial_balance, reset_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_active = true
       RETURNING id, name, initial_balance`,
      [accountId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paper trading account not found'
      });
    }
    
    res.json({
      success: true,
      message: `Paper trading account "${result.rows[0].name}" reset successfully`,
      balance: result.rows[0].initial_balance
    });
    
  } catch (error) {
    console.error('Reset paper account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset paper trading account'
    });
  }
});

module.exports = router;

