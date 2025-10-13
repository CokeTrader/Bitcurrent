/**
 * Cache Middleware
 * Use Redis to cache API responses
 */

const cache = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache GET requests
 */
function cacheMiddleware(ttlSeconds = 60) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if no cache
    if (!cache.isConnected) {
      return next();
    }

    // Generate cache key
    const cacheKey = `api:${req.path}:${JSON.stringify(req.query)}`;

    try {
      // Check cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Serving from cache', { path: req.path });
        return res.json(cachedData);
      }

      // Cache miss - store response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Cache successful responses only
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, ttlSeconds).catch(err => {
            logger.error('Failed to cache response', { error: err.message });
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
}

/**
 * Invalidate cache for specific user
 */
async function invalidateUserCache(userId) {
  try {
    const pattern = `api:*user*${userId}*`;
    const count = await cache.invalidatePattern(pattern);
    logger.info('User cache invalidated', { userId, keysDeleted: count });
  } catch (error) {
    logger.error('Failed to invalidate user cache', { userId, error: error.message });
  }
}

/**
 * Invalidate cache for specific market pair
 */
async function invalidateMarketCache(pair) {
  try {
    const pattern = `api:*markets*${pair}*`;
    const count = await cache.invalidatePattern(pattern);
    logger.info('Market cache invalidated', { pair, keysDeleted: count });
  } catch (error) {
    logger.error('Failed to invalidate market cache', { pair, error: error.message });
  }
}

module.exports = {
  cacheMiddleware,
  invalidateUserCache,
  invalidateMarketCache
};

