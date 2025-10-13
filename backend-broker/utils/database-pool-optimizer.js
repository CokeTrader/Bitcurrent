/**
 * Database Connection Pool Optimizer
 * Dynamic pool sizing based on load
 */

const { Pool } = require('pg');
const logger = require('./logger');

class DatabasePoolOptimizer {
  constructor(config = {}) {
    this.config = {
      min: config.min || 5,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
      ...config
    };

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...this.config
    });

    this.metrics = {
      totalQueries: 0,
      activeConnections: 0,
      waitingClients: 0,
      avgQueryTime: 0,
      errors: 0
    };

    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor pool events
    this.pool.on('connect', () => {
      this.metrics.activeConnections++;
      logger.debug('New database connection established');
    });

    this.pool.on('remove', () => {
      this.metrics.activeConnections--;
      logger.debug('Database connection removed');
    });

    this.pool.on('error', (err) => {
      this.metrics.errors++;
      logger.error('Database pool error', { error: err.message });
    });

    // Log pool stats every 60 seconds
    setInterval(() => {
      const stats = {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount,
        queries: this.metrics.totalQueries,
        avgQueryTime: this.metrics.avgQueryTime.toFixed(2) + 'ms',
        errors: this.metrics.errors
      };

      logger.info('Database pool stats', stats);

      // Auto-scale warning
      if (this.pool.waitingCount > 5) {
        logger.warn('High database connection wait queue', {
          waiting: this.pool.waitingCount,
          recommendation: 'Consider increasing pool size'
        });
      }
    }, 60000);
  }

  async query(text, params) {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Update metrics
      this.metrics.totalQueries++;
      this.metrics.avgQueryTime = 
        (this.metrics.avgQueryTime * (this.metrics.totalQueries - 1) + duration) / 
        this.metrics.totalQueries;

      // Warn on slow queries
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          duration: `${duration}ms`,
          query: text.substring(0, 100)
        });
      }

      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Query failed', { error: error.message });
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.connect();
  }

  getMetrics() {
    return {
      ...this.metrics,
      pool: {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount
      }
    };
  }

  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as time');
      return {
        healthy: true,
        responseTime: Date.now(),
        serverTime: result.rows[0].time
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async end() {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

// Singleton instance
const dbPool = new DatabasePoolOptimizer();

module.exports = dbPool;

