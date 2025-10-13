/**
 * Margin Trading Service
 * Leveraged trading with risk management
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class MarginTradingService {
  /**
   * Open margin position
   */
  static async openPosition(userId, positionData) {
    const { pair, side, amount, leverage, entryPrice } = positionData;

    // Validate leverage (max 10x for crypto)
    if (leverage < 1 || leverage > 10) {
      throw new Error('Leverage must be between 1x and 10x');
    }

    // Calculate required margin
    const notionalValue = amount * entryPrice;
    const requiredMargin = notionalValue / leverage;

    // Check user has sufficient margin
    const balance = await this.getUserMarginBalance(userId);
    if (balance.available < requiredMargin) {
      throw new Error(`Insufficient margin. Required: £${requiredMargin.toFixed(2)}, Available: £${balance.available.toFixed(2)}`);
    }

    // Calculate liquidation price
    const liquidationPrice = this.calculateLiquidationPrice(entryPrice, leverage, side);

    // Open position
    const position = await qb.insert('margin_positions', {
      user_id: userId,
      pair,
      side,
      amount,
      leverage,
      entry_price: entryPrice,
      liquidation_price: liquidationPrice,
      margin_used: requiredMargin,
      status: 'open',
      opened_at: new Date(),
      updated_at: new Date()
    });

    // Lock margin
    await this.lockMargin(userId, requiredMargin);

    logger.info('Margin position opened', {
      userId,
      positionId: position.id,
      pair,
      leverage: `${leverage}x`,
      notionalValue
    });

    return position;
  }

  /**
   * Calculate liquidation price
   */
  static calculateLiquidationPrice(entryPrice, leverage, side) {
    // Simplified liquidation calculation
    // Liquidation occurs when position loses 90% of margin
    const liquidationThreshold = 0.9;
    const priceMove = entryPrice * (liquidationThreshold / leverage);

    if (side === 'long') {
      return entryPrice - priceMove;
    } else {
      return entryPrice + priceMove;
    }
  }

  /**
   * Check for liquidations (runs periodically)
   */
  static async checkLiquidations() {
    const openPositions = await qb.select('margin_positions', { status: 'open' });

    for (const position of openPositions) {
      const currentPrice = await this.getCurrentPrice(position.pair);
      
      const shouldLiquidate = (
        (position.side === 'long' && currentPrice <= position.liquidation_price) ||
        (position.side === 'short' && currentPrice >= position.liquidation_price)
      );

      if (shouldLiquidate) {
        await this.liquidatePosition(position.id);
      }
    }
  }

  /**
   * Liquidate position
   */
  static async liquidatePosition(positionId) {
    const position = (await qb.select('margin_positions', { id: positionId }))[0];

    if (!position || position.status !== 'open') {
      return false;
    }

    // Close position at liquidation price
    const pnl = this.calculatePnL(position, position.liquidation_price);

    await qb.update('margin_positions',
      {
        status: 'liquidated',
        close_price: position.liquidation_price,
        pnl,
        closed_at: new Date(),
        updated_at: new Date()
      },
      { id: positionId }
    );

    // Return remaining margin (if any)
    const remainingMargin = position.margin_used + pnl;
    if (remainingMargin > 0) {
      await this.unlockMargin(position.user_id, remainingMargin);
    }

    // Send liquidation notification
    logger.warn('Position liquidated', {
      userId: position.user_id,
      positionId,
      pair: position.pair,
      pnl
    });

    return true;
  }

  /**
   * Close margin position (user initiated)
   */
  static async closePosition(positionId, userId, closePrice) {
    const position = (await qb.select('margin_positions', { id: positionId, user_id: userId }))[0];

    if (!position || position.status !== 'open') {
      throw new Error('Position not found or already closed');
    }

    const pnl = this.calculatePnL(position, closePrice);

    await qb.update('margin_positions',
      {
        status: 'closed',
        close_price: closePrice,
        pnl,
        closed_at: new Date(),
        updated_at: new Date()
      },
      { id: positionId }
    );

    // Return margin + P&L
    await this.unlockMargin(userId, position.margin_used + pnl);

    logger.info('Margin position closed', {
      userId,
      positionId,
      pnl
    });

    return { position, pnl };
  }

  /**
   * Calculate P&L for margin position
   */
  static calculatePnL(position, currentPrice) {
    const priceChange = currentPrice - position.entry_price;
    const pnlPerUnit = position.side === 'long' ? priceChange : -priceChange;
    const totalPnL = pnlPerUnit * position.amount;
    
    return totalPnL;
  }

  /**
   * Get user's margin balance
   */
  static async getUserMarginBalance(userId) {
    const balances = await qb.select('balances', { user_id: userId, currency: 'USD' });
    const balance = balances[0] || { total: 0, available: 0, locked: 0 };

    return {
      total: parseFloat(balance.total),
      available: parseFloat(balance.available),
      locked: parseFloat(balance.locked)
    };
  }

  /**
   * Lock margin for position
   */
  static async lockMargin(userId, amount) {
    await qb.query(
      `UPDATE balances 
       SET available = available - $1, locked = locked + $1 
       WHERE user_id = $2 AND currency = 'USD'`,
      [amount, userId]
    );
  }

  /**
   * Unlock margin after position closes
   */
  static async unlockMargin(userId, amount) {
    if (amount > 0) {
      await qb.query(
        `UPDATE balances 
         SET available = available + $1, locked = locked - $1 
         WHERE user_id = $2 AND currency = 'USD'`,
        [amount, userId]
      );
    }
  }

  /**
   * Get current price (from cache or API)
   */
  static async getCurrentPrice(pair) {
    // In production, fetch from Alpaca/CoinMarketCap
    const mockPrices = {
      'BTC/USD': 67234.50,
      'ETH/USD': 3567.89,
      'SOL/USD': 145.67
    };
    return mockPrices[pair] || 1000;
  }

  /**
   * Get user's open positions
   */
  static async getOpenPositions(userId) {
    return await qb.select('margin_positions', { user_id: userId, status: 'open' });
  }

  /**
   * Get position history
   */
  static async getPositionHistory(userId, limit = 50) {
    const sql = `
      SELECT * FROM margin_positions
      WHERE user_id = $1
      ORDER BY opened_at DESC
      LIMIT $2
    `;
    
    return await qb.query(sql, [userId, limit]);
  }
}

module.exports = MarginTradingService;

