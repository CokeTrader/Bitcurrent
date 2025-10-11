// Orders routes
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const alpaca = require('../services/alpaca'); // Using Alpaca instead of Binance
const ledger = require('../services/ledger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * GET /orders/quote
 * Get quote for market order
 */
router.get('/quote', async (req, res) => {
  try {
    const { symbol, side, amount } = req.query;
    
    // Validation
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'symbol, side, and amount are required'
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
    
    // Get quote from Alpaca
    const quote = await alpaca.getQuote(symbol, side.toUpperCase(), amountNum);
    
    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quote'
    });
  }
});

/**
 * POST /orders
 * Place market order
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, side, amount } = req.body;
    
    // Validation
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'symbol, side, and amount are required'
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
    
    // Parse symbol (e.g., 'BTC-GBP' -> base: 'BTC', quote: 'GBP')
    const [baseCurrency, quoteCurrency] = symbol.split('-');
    if (!baseCurrency || !quoteCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol format. Use format: BTC-GBP'
      });
    }
    
    // Get quote from Alpaca
    const quote = await alpaca.getQuote(
      symbol, // Use our format: BTC-GBP
      side.toUpperCase(),
      amountNum
    );
    
    // Determine which currency to deduct
    const deductCurrency = side.toUpperCase() === 'BUY' ? quoteCurrency : baseCurrency;
    const deductAmount = side.toUpperCase() === 'BUY' ? quote.quoteAmount : quote.baseAmount;
    
    // Check balance
    const balance = await ledger.getBalance(userId, deductCurrency);
    if (balance.available < deductAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient ${deductCurrency} balance. Available: ${balance.available}, Required: ${deductAmount}`
      });
    }
    
    // Create order in database
    const orderId = uuidv4();
    await query(
      `INSERT INTO orders (id, user_id, symbol, side, type, amount, quote_amount, status, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [orderId, userId, symbol, side.toUpperCase(), 'MARKET', quote.baseAmount, quote.quoteAmount, 'PENDING', 'binance']
    );
    
    try {
      // Reserve funds
      await ledger.reserve(userId, deductCurrency, deductAmount, 'ORDER', orderId);
      
      // Place order on Alpaca
      const alpacaOrder = await alpaca.placeMarketOrder(
        symbol, // Use our format: BTC-GBP
        side.toUpperCase(),
        quote.baseAmount // Quantity in crypto
      );
      
      // Order filled successfully
      await transaction(async (client) => {
        // Update order status
        await client.query(
          `UPDATE orders 
           SET status = $1, provider_order_id = $2, filled_amount = $3, 
               average_price = $4, filled_at = NOW()
           WHERE id = $5`,
          ['FILLED', alpacaOrder.orderId, alpacaOrder.filledQty, alpacaOrder.filledAvgPrice, orderId]
        );
        
        // Deduct spent currency (from reserved)
        const accountResult = await client.query(
          'SELECT id FROM accounts WHERE user_id = $1 AND currency = $2',
          [userId, deductCurrency]
        );
        const accountId = accountResult.rows[0].id;
        
        await client.query(
          'UPDATE accounts SET balance = balance - $1, reserved = reserved - $1 WHERE id = $2',
          [deductAmount, accountId]
        );
        
        await client.query(
          `INSERT INTO transactions 
           (id, user_id, account_id, type, amount, balance_before, balance_after, currency, reference_type, reference_id, description)
           SELECT $1, $2, $3, $4, $5, balance + $5, balance, $6, $7, $8, $9
           FROM accounts WHERE id = $3`,
          [uuidv4(), userId, accountId, 'TRADE', -deductAmount, deductCurrency, 'ORDER', orderId, `${side} ${symbol}`]
        );
        
        // Credit received currency
        const receiveCurrency = side.toUpperCase() === 'BUY' ? baseCurrency : quoteCurrency;
        const receiveAmount = side.toUpperCase() === 'BUY' ? alpacaOrder.filledQty : (alpacaOrder.filledQty * alpacaOrder.filledAvgPrice);
        
        await ledger.credit(userId, receiveCurrency, receiveAmount, 'TRADE', 'ORDER', orderId, `${side} ${symbol}`);
      });
      
      res.json({
        success: true,
        message: 'Order filled successfully',
        order: {
          id: orderId,
          symbol,
          side: side.toUpperCase(),
          amount: quote.baseAmount,
          filledAmount: alpacaOrder.filledQty,
          averagePrice: alpacaOrder.filledAvgPrice,
          total: alpacaOrder.filledQty * alpacaOrder.filledAvgPrice,
          status: 'FILLED',
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Order failed - release reserved funds and update order
      await ledger.release(userId, deductCurrency, deductAmount, 'ORDER', orderId);
      await query(
        'UPDATE orders SET status = $1, error_message = $2 WHERE id = $3',
        ['FAILED', error.message, orderId]
      );
      
      throw error;
    }
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place order'
    });
  }
});

/**
 * GET /orders
 * Get user's order history
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await query(
      `SELECT id, symbol, side, type, amount, quote_amount, price, 
              filled_amount, average_price, fee, status, created_at, filled_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const orders = result.rows.map(row => ({
      id: row.id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      amount: parseFloat(row.amount),
      quoteAmount: parseFloat(row.quote_amount),
      price: row.price ? parseFloat(row.price) : null,
      filledAmount: parseFloat(row.filled_amount),
      averagePrice: row.average_price ? parseFloat(row.average_price) : null,
      fee: parseFloat(row.fee),
      status: row.status,
      createdAt: row.created_at,
      filledAt: row.filled_at
    }));
    
    res.json({
      success: true,
      orders,
      pagination: {
        limit,
        offset,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
});

/**
 * GET /orders/:id
 * Get specific order details
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    const result = await query(
      `SELECT id, symbol, side, type, amount, quote_amount, price,
              filled_amount, average_price, fee, status, error_message,
              created_at, filled_at, cancelled_at
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const order = result.rows[0];
    
    res.json({
      success: true,
      order: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        amount: parseFloat(order.amount),
        quoteAmount: parseFloat(order.quote_amount),
        price: order.price ? parseFloat(order.price) : null,
        filledAmount: parseFloat(order.filled_amount),
        averagePrice: order.average_price ? parseFloat(order.average_price) : null,
        fee: parseFloat(order.fee),
        status: order.status,
        errorMessage: order.error_message,
        createdAt: order.created_at,
        filledAt: order.filled_at,
        cancelledAt: order.cancelled_at
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});

module.exports = router;

