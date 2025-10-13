/**
 * Automated Trading Bot Service
 * 
 * Create and manage automated trading strategies:
 * - DCA (Dollar Cost Averaging)
 * - Grid Trading
 * - RSI-based trading
 * - MACD strategy
 * - Custom user-defined bots
 */

const pool = require('../config/database');
const multiAssetService = require('./multi-asset-trading-service');
const EventEmitter = require('events');

class TradingBotService extends EventEmitter {
  constructor() {
    super();
    this.activeBots = new Map();
    this.monitoringInterval = null;
    this.checkInterval = 60000; // Check every 60 seconds
  }

  /**
   * Create a DCA (Dollar Cost Averaging) bot
   * Automatically buys fixed amount at regular intervals
   */
  async createDCABot(userId, config) {
    try {
      const { name, asset, amount, intervalHours } = config;

      // Validate
      if (!asset || !amount || !intervalHours) {
        return {
          success: false,
          error: 'Missing required fields: asset, amount, intervalHours'
        };
      }

      // Create bot in database
      const result = await pool.query(
        `INSERT INTO trading_bots (
          user_id, name, type, asset, config, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [
          userId,
          name || `DCA ${asset}`,
          'dca',
          asset,
          JSON.stringify({
            amount,
            intervalHours,
            lastExecuted: null
          }),
          'active'
        ]
      );

      const bot = result.rows[0];

      return {
        success: true,
        bot,
        message: `DCA bot created. Will buy £${amount} of ${asset} every ${intervalHours} hours`
      };

    } catch (error) {
      console.error('Create DCA bot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a Grid Trading bot
   * Automatically buys low and sells high within a price range
   */
  async createGridBot(userId, config) {
    try {
      const { name, asset, lowerPrice, upperPrice, gridLevels, totalAmount } = config;

      if (!asset || !lowerPrice || !upperPrice || !gridLevels || !totalAmount) {
        return {
          success: false,
          error: 'Missing required fields for grid bot'
        };
      }

      const result = await pool.query(
        `INSERT INTO trading_bots (
          user_id, name, type, asset, config, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [
          userId,
          name || `Grid ${asset}`,
          'grid',
          asset,
          JSON.stringify({
            lowerPrice,
            upperPrice,
            gridLevels,
            totalAmount,
            amountPerGrid: totalAmount / gridLevels,
            orders: []
          }),
          'active'
        ]
      );

      return {
        success: true,
        bot: result.rows[0],
        message: `Grid bot created with ${gridLevels} levels between £${lowerPrice}-£${upperPrice}`
      };

    } catch (error) {
      console.error('Create grid bot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create an RSI-based trading bot
   * Buys when RSI < 30 (oversold), sells when RSI > 70 (overbought)
   */
  async createRSIBot(userId, config) {
    try {
      const { name, asset, buyRSI, sellRSI, tradeAmount } = config;

      const result = await pool.query(
        `INSERT INTO trading_bots (
          user_id, name, type, asset, config, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [
          userId,
          name || `RSI ${asset}`,
          'rsi',
          asset,
          JSON.stringify({
            buyRSI: buyRSI || 30,
            sellRSI: sellRSI || 70,
            tradeAmount: tradeAmount || 50,
            rsiPeriod: 14
          }),
          'active'
        ]
      );

      return {
        success: true,
        bot: result.rows[0],
        message: `RSI bot created. Buys at RSI<${buyRSI || 30}, sells at RSI>${sellRSI || 70}`
      };

    } catch (error) {
      console.error('Create RSI bot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's bots
   */
  async getUserBots(userId, status = null) {
    try {
      let query = 'SELECT * FROM trading_bots WHERE user_id = $1';
      const params = [userId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);

      return {
        success: true,
        bots: result.rows
      };

    } catch (error) {
      console.error('Get user bots error:', error);
      return {
        success: false,
        error: error.message,
        bots: []
      };
    }
  }

  /**
   * Update bot status
   */
  async updateBotStatus(userId, botId, status) {
    try {
      const result = await pool.query(
        `UPDATE trading_bots 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [status, botId, userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Bot not found'
        };
      }

      return {
        success: true,
        bot: result.rows[0],
        message: `Bot ${status === 'active' ? 'activated' : 'paused'}`
      };

    } catch (error) {
      console.error('Update bot status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a bot
   */
  async deleteBot(userId, botId) {
    try {
      const result = await pool.query(
        `DELETE FROM trading_bots 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [botId, userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Bot not found'
        };
      }

      return {
        success: true,
        message: 'Bot deleted successfully'
      };

    } catch (error) {
      console.error('Delete bot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start monitoring and executing bots
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      console.log('Bot monitoring already running');
      return;
    }

    console.log('🤖 Starting trading bot monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkAndExecuteBots();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring bots
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏸️  Stopped trading bot monitoring');
    }
  }

  /**
   * Check and execute active bots
   */
  async checkAndExecuteBots() {
    try {
      // Get all active bots
      const result = await pool.query(
        `SELECT * FROM trading_bots WHERE status = 'active'`
      );

      for (const bot of result.rows) {
        switch (bot.type) {
          case 'dca':
            await this.executeDCABot(bot);
            break;
          case 'grid':
            await this.executeGridBot(bot);
            break;
          case 'rsi':
            await this.executeRSIBot(bot);
            break;
        }
      }

    } catch (error) {
      console.error('Check and execute bots error:', error);
    }
  }

  /**
   * Execute a DCA bot
   */
  async executeDCABot(bot) {
    try {
      const config = bot.config;
      const now = new Date();
      
      // Check if enough time has passed
      if (config.lastExecuted) {
        const lastExec = new Date(config.lastExecuted);
        const hoursSince = (now - lastExec) / (1000 * 60 * 60);
        
        if (hoursSince < config.intervalHours) {
          return; // Not time yet
        }
      }

      console.log(`🤖 Executing DCA bot #${bot.id} - buying £${config.amount} of ${bot.asset}`);

      // Execute buy
      const buyResult = await multiAssetService.buyAsset(
        bot.user_id,
        bot.asset,
        config.amount
      );

      if (buyResult.success) {
        // Update bot config
        config.lastExecuted = now.toISOString();
        config.executionCount = (config.executionCount || 0) + 1;

        await pool.query(
          `UPDATE trading_bots 
           SET config = $1, updated_at = NOW() 
           WHERE id = $2`,
          [JSON.stringify(config), bot.id]
        );

        // Log execution
        await pool.query(
          `INSERT INTO bot_executions (
            bot_id, type, asset, amount, price, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [bot.id, 'buy', bot.asset, buyResult.amount, buyResult.price, 'success']
        );

        this.emit('botExecuted', {
          botId: bot.id,
          userId: bot.user_id,
          type: 'dca',
          result: buyResult
        });
      }

    } catch (error) {
      console.error(`DCA bot #${bot.id} execution error:`, error);
    }
  }

  /**
   * Execute a Grid bot (placeholder)
   */
  async executeGridBot(bot) {
    // Grid bot logic - place buy/sell orders at grid levels
    // This would require more complex logic with limit orders
    console.log(`🤖 Grid bot #${bot.id} checking...`);
  }

  /**
   * Execute an RSI bot (placeholder)
   */
  async executeRSIBot(bot) {
    // RSI bot logic - calculate RSI and execute trades
    // This would require historical price data
    console.log(`🤖 RSI bot #${bot.id} checking...`);
  }

  /**
   * Get bot performance statistics
   */
  async getBotStats(userId, botId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_executions,
          SUM(CASE WHEN type = 'buy' THEN amount ELSE 0 END) as total_bought,
          SUM(CASE WHEN type = 'sell' THEN amount ELSE 0 END) as total_sold,
          AVG(price) as avg_price
         FROM bot_executions 
         WHERE bot_id = $1
         AND bot_id IN (SELECT id FROM trading_bots WHERE user_id = $2)`,
        [botId, userId]
      );

      return {
        success: true,
        stats: result.rows[0]
      };

    } catch (error) {
      console.error('Get bot stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TradingBotService();

