/**
 * Advanced Orders - Unit Tests
 * 
 * Test limit, stop-loss, take-profit, trailing stop orders
 */

const { expect } = require('chai');
const advancedOrderService = require('../services/advanced-order-service');
const pool = require('../config/database');

describe('Advanced Order Service', () => {
  let testUserId;

  before(async () => {
    // Create test user with balances
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, gbp_balance, btc_balance, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      ['orders@test.com', 'hashed', 1000.00, 0.01]
    );
    testUserId = result.rows[0].id;
  });

  after(async () => {
    await pool.query('DELETE FROM advanced_orders WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('Limit Orders', () => {
    it('should create buy limit order', async () => {
      const result = await advancedOrderService.createLimitOrder(
        testUserId,
        'buy',
        100, // £100
        35000 // £35,000 limit price
      );

      expect(result.success).to.be.true;
      expect(result.order).to.exist;
      expect(result.order.type).to.equal('limit');
      expect(result.order.side).to.equal('buy');
    });

    it('should create sell limit order', async () => {
      const result = await advancedOrderService.createLimitOrder(
        testUserId,
        'sell',
        0.001, // 0.001 BTC
        50000 // £50,000 limit price
      );

      expect(result.success).to.be.true;
      expect(result.order).to.exist;
    });

    it('should reject order with insufficient balance', async () => {
      const result = await advancedOrderService.createLimitOrder(
        testUserId,
        'buy',
        10000, // More than user has
        35000
      );

      expect(result.success).to.be.false;
      expect(result.error).to.include('Insufficient');
    });
  });

  describe('Stop-Loss Orders', () => {
    it('should create stop-loss order', async () => {
      const result = await advancedOrderService.createStopLoss(
        testUserId,
        0.001,
        30000 // Stop price
      );

      expect(result.success).to.be.true;
      expect(result.order.type).to.equal('stop_loss');
    });
  });

  describe('Take-Profit Orders', () => {
    it('should create take-profit order', async () => {
      const result = await advancedOrderService.createTakeProfit(
        testUserId,
        0.001,
        60000 // Take-profit price
      );

      expect(result.success).to.be.true;
      expect(result.order.type).to.equal('take_profit');
    });
  });

  describe('Trailing Stop Orders', () => {
    it('should create trailing stop order', async () => {
      const result = await advancedOrderService.createTrailingStop(
        testUserId,
        0.001,
        5 // 5% trail
      );

      expect(result.success).to.be.true;
      expect(result.order.type).to.equal('trailing_stop');
      expect(result.order.trail_percent).to.equal(5);
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel pending order', async () => {
      // Create order first
      const createResult = await advancedOrderService.createLimitOrder(
        testUserId,
        'buy',
        50,
        35000
      );

      expect(createResult.success).to.be.true;

      // Cancel it
      const cancelResult = await advancedOrderService.cancelOrder(
        testUserId,
        createResult.order.id
      );

      expect(cancelResult.success).to.be.true;
    });
  });
});

