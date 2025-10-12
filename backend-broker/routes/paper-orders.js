// Paper Trading Orders Routes
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const paperTradingService = require('../services/paper-trading');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /paper-orders
 * Place a paper trading order (simulated, no real exchange)
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { paperAccountId, symbol, side, amount } = req.body;
    
    // Validation
    if (!paperAccountId || !symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'paperAccountId, symbol, side, and amount are required'
      });
    }
    
    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'side must be BUY or SELL'
      });
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }
    
    // Verify paper account ownership
    const accountCheck = await query(
      'SELECT id, current_balance FROM paper_trading_accounts WHERE id = $1 AND user_id = $2 AND is_active = true',
      [paperAccountId, userId]
    );
    
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paper trading account not found or inactive'
      });
    }
    
    const currentBalance = parseFloat(accountCheck.rows[0].current_balance);
    
    // For BUY orders, check if user has enough balance
    if (side.toUpperCase() === 'BUY' && currentBalance < amountNum) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. You have £${currentBalance.toLocaleString()}, need £${amountNum.toLocaleString()}`
      });
    }
    
    // Execute paper trade (simulated)
    const tradeResult = await paperTradingService.executePaperTrade(
      userId,
      paperAccountId,
      symbol,
      side.toUpperCase(),
      amountNum
    );
    
    if (!tradeResult.success) {
      return res.status(400).json({
        success: false,
        error: tradeResult.error || 'Trade execution failed'
      });
    }
    
    // Calculate balance change
    let balanceChange = 0;
    if (side.toUpperCase() === 'BUY') {
      balanceChange = -(tradeResult.quoteAmount); // Subtract GBP
    } else {
      balanceChange = tradeResult.quoteAmount - tradeResult.feeAmount; // Add GBP minus fee
    }
    
    // Create order ID
    const orderId = uuidv4();
    
    // Update paper account balance and create order record
    await transaction(async (client) => {
      // Update paper account balance
      await client.query(
        `UPDATE paper_trading_accounts 
         SET current_balance = current_balance + $1
         WHERE id = $2`,
        [balanceChange, paperAccountId]
      );
      
      // Create order record
      await client.query(
        `INSERT INTO orders (
          id, user_id, symbol, side, type, amount, quote_amount, 
          price, status, filled_amount, average_price, fee, fee_currency,
          provider, provider_order_id, filled_at, created_at
        ) VALUES ($1, $2, $3, $4, 'MARKET', $5, $6, $7, 'FILLED', $5, $7, $8, $9, 'PAPER', $10, NOW(), NOW())`,
        [
          orderId,
          userId,
          symbol,
          side.toUpperCase(),
          tradeResult.baseAmount,
          tradeResult.quoteAmount,
          tradeResult.price,
          tradeResult.feeAmount,
          tradeResult.feeCurrency,
          `paper_${paperAccountId}_${Date.now()}`
        ]
      );
    });
    
    // Get updated balance
    const updatedAccount = await query(
      'SELECT current_balance FROM paper_trading_accounts WHERE id = $1',
      [paperAccountId]
    );
    
    res.json({
      success: true,
      message: `Paper ${side.toLowerCase()} order executed successfully`,
      order: {
        id: orderId,
        symbol,
        side: side.toUpperCase(),
        price: tradeResult.price,
        amount: tradeResult.baseAmount,
        quoteAmount: tradeResult.quoteAmount,
        fee: tradeResult.feeAmount,
        status: 'FILLED',
        isPaper: true
      },
      balance: {
        before: currentBalance,
        after: parseFloat(updatedAccount.rows[0].current_balance),
        change: balanceChange
      }
    });
    
  } catch (error) {
    console.error('Paper order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute paper trade',
      details: error.message
    });
  }
});

/**
 * GET /paper-orders/history
 * Get paper trading order history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { paperAccountId, limit = 50 } = req.query;
    
    let queryText, queryParams;
    
    if (paperAccountId) {
      // Get orders for specific paper account
      queryText = `
        SELECT o.* FROM orders o
        WHERE o.user_id = $1 
        AND o.provider = 'PAPER'
        AND o.provider_order_id LIKE $2
        ORDER BY o.created_at DESC
        LIMIT $3
      `;
      queryParams = [userId, `paper_${paperAccountId}%`, limit];
    } else {
      // Get all paper orders
      queryText = `
        SELECT * FROM orders
        WHERE user_id = $1 AND provider = 'PAPER'
        ORDER BY created_at DESC
        LIMIT $2
      `;
      queryParams = [userId, limit];
    }
    
    const result = await query(queryText, queryParams);
    
    res.json({
      success: true,
      orders: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Get paper orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get paper trading history'
    });
  }
});

module.exports = router;

