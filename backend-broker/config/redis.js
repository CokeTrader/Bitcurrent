/**
 * Redis Configuration
 * Caching layer for improved performance
 */

const redis = require('redis');
const logger = require('../utils/logger');

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting');
      });

      await this.client.connect();
      
      logger.info('Redis cache initialized');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      // Don't throw - app should work without Redis
    }
  }

  /**
   * Get cached value
   */
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected) return false;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Cache with automatic invalidation pattern
   */
  async cacheOrFetch(key, fetchFn, ttlSeconds = 300) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    // Cache miss - fetch data
    logger.debug('Cache miss', { key });
    const data = await fetchFn();
    
    // Store in cache
    await this.set(key, data, ttlSeconds);
    
    return data;
  }

  /**
   * Invalidate cache pattern
   */
  async invalidatePattern(pattern) {
    if (!this.isConnected) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Redis pattern invalidation error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async incr(key, ttlSeconds = 60) {
    if (!this.isConnected) return 1;

    try {
      const value = await this.client.incr(key);
      if (value === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Redis INCR error', { key, error: error.message });
      return 1;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys) {
    if (!this.isConnected) return [];

    try {
      const values = await this.client.mGet(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Redis MGET error', { error: error.message });
      return [];
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs, ttlSeconds = 300) {
    if (!this.isConnected) return false;

    try {
      const multi = this.client.multi();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        multi.setEx(key, ttlSeconds, JSON.stringify(value));
      });
      
      await multi.exec();
      return true;
    } catch (error) {
      logger.error('Redis MSET error', { error: error.message });
      return false;
    }
  }

  /**
   * Close connection
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('Redis client disconnected');
    }
  }
}

// Singleton instance
const cache = new RedisCache();

module.exports = cache;

