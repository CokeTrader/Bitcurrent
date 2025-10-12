/**
 * Safe Query Builder
 * Prevents SQL injection through parameterized queries
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

class QueryBuilder {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Safe SELECT query
   */
  async select(table, conditions = {}, columns = '*') {
    const whereClause = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(conditions).forEach(([key, value]) => {
      whereClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const sql = `
      SELECT ${columns}
      FROM ${table}
      ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
    `;

    try {
      const result = await this.pool.query(sql, values);
      return result.rows;
    } catch (error) {
      logger.error('SELECT query error', { sql, error: error.message });
      throw error;
    }
  }

  /**
   * Safe INSERT query
   */
  async insert(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await this.pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      logger.error('INSERT query error', { sql, error: error.message });
      throw error;
    }
  }

  /**
   * Safe UPDATE query
   */
  async update(table, data, conditions) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const whereClause = [];
    Object.entries(conditions).forEach(([key, value]) => {
      whereClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const sql = `
      UPDATE ${table}
      SET ${setClauses.join(', ')}
      WHERE ${whereClause.join(' AND ')}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      logger.error('UPDATE query error', { sql, error: error.message });
      throw error;
    }
  }

  /**
   * Safe DELETE query
   */
  async delete(table, conditions) {
    const whereClause = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(conditions).forEach(([key, value]) => {
      whereClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const sql = `
      DELETE FROM ${table}
      WHERE ${whereClause.join(' AND ')}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(sql, values);
      return result.rows;
    } catch (error) {
      logger.error('DELETE query error', { sql, error: error.message });
      throw error;
    }
  }

  /**
   * Safe raw query (use sparingly)
   * Forces parameterization
   */
  async query(sql, params = []) {
    // Detect potential SQL injection
    if (sql.includes('${') || sql.includes('+')) {
      throw new Error('Unsafe SQL detected. Use parameterized queries only.');
    }

    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Raw query error', { sql, error: error.message });
      throw error;
    }
  }

  /**
   * Transaction wrapper
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = QueryBuilder;

