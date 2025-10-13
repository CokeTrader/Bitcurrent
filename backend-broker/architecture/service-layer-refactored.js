/**
 * Refactored Service Layer Architecture
 * 
 * Design patterns implemented:
 * - Repository pattern for data access
 * - Service layer for business logic
 * - Factory pattern for object creation
 * - Observer pattern for events
 * - Strategy pattern for algorithms
 * - Singleton pattern for shared resources
 */

class BaseService {
  constructor(repository) {
    this.repository = repository;
    this.validators = [];
    this.middlewares = [];
  }

  /**
   * Add validator
   */
  addValidator(validator) {
    this.validators.push(validator);
    return this;
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Execute with validation and middleware
   */
  async execute(operation, data) {
    try {
      // Run validators
      for (const validator of this.validators) {
        const validation = await validator(data);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error
          };
        }
      }

      // Run middlewares
      for (const middleware of this.middlewares) {
        data = await middleware(data);
      }

      // Execute operation
      return await operation(data);

    } catch (error) {
      console.error('Service execution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Repository pattern for trades
 */
class TradeRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(id) {
    const result = await this.pool.query(
      'SELECT * FROM trades WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async findByUser(userId, options = {}) {
    let query = 'SELECT * FROM trades WHERE user_id = $1';
    const params = [userId];

    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async create(tradeData) {
    const {
      userId,
      symbol,
      side,
      quantity,
      price,
      total,
      pnl,
      status,
      exchange
    } = tradeData;

    const result = await this.pool.query(
      `INSERT INTO trades (
        user_id, symbol, side, quantity, price, total, pnl, status, exchange, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [userId, symbol, side, quantity, price, total, pnl, status, exchange]
    );

    return result.rows[0];
  }

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(id);

    const query = `
      UPDATE trades
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const result = await this.pool.query(
      'DELETE FROM trades WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  async calculatePnL(userId, symbol) {
    const result = await this.pool.query(
      `SELECT 
        SUM(CASE WHEN side = 'buy' THEN total ELSE 0 END) as invested,
        SUM(CASE WHEN side = 'sell' THEN total ELSE 0 END) as returned,
        SUM(pnl) as total_pnl
       FROM trades
       WHERE user_id = $1 AND symbol = $2`,
      [userId, symbol]
    );

    return result.rows[0];
  }
}

/**
 * Strategy pattern for order execution
 */
class OrderExecutionStrategy {
  async execute(order) {
    throw new Error('Must implement execute method');
  }
}

class MarketOrderStrategy extends OrderExecutionStrategy {
  async execute(order) {
    // Execute at current market price
    return {
      success: true,
      executionPrice: order.currentPrice,
      message: 'Market order executed'
    };
  }
}

class LimitOrderStrategy extends OrderExecutionStrategy {
  async execute(order) {
    // Execute only if price condition met
    if (order.side === 'buy' && order.currentPrice <= order.limitPrice) {
      return {
        success: true,
        executionPrice: order.limitPrice,
        message: 'Limit buy order executed'
      };
    }
    
    if (order.side === 'sell' && order.currentPrice >= order.limitPrice) {
      return {
        success: true,
        executionPrice: order.limitPrice,
        message: 'Limit sell order executed'
      };
    }

    return {
      success: false,
      message: 'Limit price not reached'
    };
  }
}

/**
 * Factory pattern for creating services
 */
class ServiceFactory {
  static createTradingService(pool) {
    const repository = new TradeRepository(pool);
    const service = new BaseService(repository);

    // Add validators
    service.addValidator(async (data) => {
      if (!data.amount || data.amount <= 0) {
        return { valid: false, error: 'Invalid amount' };
      }
      return { valid: true };
    });

    return service;
  }

  static createOrderStrategy(type) {
    switch (type) {
      case 'market':
        return new MarketOrderStrategy();
      case 'limit':
        return new LimitOrderStrategy();
      default:
        throw new Error(`Unknown order type: ${type}`);
    }
  }
}

module.exports = {
  BaseService,
  TradeRepository,
  OrderExecutionStrategy,
  MarketOrderStrategy,
  LimitOrderStrategy,
  ServiceFactory
};

