/**
 * Database Query Optimizer
 * 
 * Based on research: PostgreSQL optimization best practices
 * - Query result caching
 * - Prepared statements
 * - Query plan analysis
 * - Index suggestions
 * - Connection pooling optimization
 */

const pool = require('../config/database');
const crypto = require('crypto');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.preparedStatements = new Map();
  }

  /**
   * Execute query with caching
   */
  async executeWithCache(query, params, ttlSeconds = 60) {
    const cacheKey = this.generateCacheKey(query, params);

    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      this.cacheHits++;
      return cached.result;
    }

    this.cacheMisses++;

    // Execute query
    const result = await pool.query(query, params);

    // Cache result
    this.queryCache.set(cacheKey, {
      result,
      expiry: Date.now() + (ttlSeconds * 1000)
    });

    return result;
  }

  /**
   * Generate cache key from query and params
   */
  generateCacheKey(query, params) {
    const paramStr = params ? JSON.stringify(params) : '';
    return crypto.createHash('md5').update(query + paramStr).digest('hex');
  }

  /**
   * Get or create prepared statement
   */
  async getPreparedStatement(name, query) {
    if (!this.preparedStatements.has(name)) {
      await pool.query(`PREPARE ${name} AS ${query}`);
      this.preparedStatements.set(name, true);
    }
    return name;
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(query, params) {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await pool.query(explainQuery, params);
      
      const plan = result.rows[0]['QUERY PLAN'][0];

      return {
        success: true,
        analysis: {
          totalCost: plan['Total Cost'],
          executionTime: plan['Execution Time'],
          planningTime: plan['Planning Time'],
          suggestions: this.generateSuggestions(plan)
        }
      };

    } catch (error) {
      console.error('Query analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate optimization suggestions
   */
  generateSuggestions(plan) {
    const suggestions = [];

    if (plan['Total Cost'] > 1000) {
      suggestions.push('Consider adding indexes to improve query performance');
    }

    if (plan['Execution Time'] > 100) {
      suggestions.push('Query takes > 100ms - consider optimization');
    }

    // Check for sequential scans
    const planStr = JSON.stringify(plan);
    if (planStr.includes('Seq Scan')) {
      suggestions.push('Sequential scan detected - add index for better performance');
    }

    return suggestions;
  }

  /**
   * Suggest missing indexes
   */
  async suggestIndexes() {
    try {
      // Query to find missing indexes
      const result = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats
        WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.5
        ORDER BY n_distinct DESC
        LIMIT 20
      `);

      const suggestions = result.rows.map(row => ({
        table: row.tablename,
        column: row.attname,
        suggestion: `CREATE INDEX idx_${row.tablename}_${row.attname} ON ${row.tablename}(${row.attname});`,
        reason: `High cardinality (${row.n_distinct} distinct values), low correlation`
      }));

      return {
        success: true,
        suggestions
      };

    } catch (error) {
      console.error('Suggest indexes error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 
      ? ((this.cacheHits / totalRequests) * 100).toFixed(2)
      : 0;

    return {
      cacheSize: this.queryCache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      preparedStatements: this.preparedStatements.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.queryCache.clear();
    return {
      success: true,
      message: 'Cache cleared'
    };
  }

  /**
   * Optimize database (VACUUM ANALYZE)
   */
  async optimizeDatabase() {
    try {
      await pool.query('VACUUM ANALYZE');
      
      return {
        success: true,
        message: 'Database optimized'
      };

    } catch (error) {
      console.error('Optimize database error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new QueryOptimizer();

