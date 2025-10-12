/**
 * Caching middleware for API responses
 * Reduces load on Alpaca API and improves response times
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Create cache instances
const priceCache = new NodeCache({
  stdTTL: 5, // 5 seconds for prices
  checkperiod: 10
});

const marketDataCache = new NodeCache({
  stdTTL: 60, // 1 minute for market data
  checkperiod: 120
});

const userDataCache = new NodeCache({
  stdTTL: 300, // 5 minutes for user data
  checkperiod: 600
});

/**
 * Cache middleware factory
 */
function cacheMiddleware(cacheInstance, keyGenerator) {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = keyGenerator ? keyGenerator(req) : req.originalUrl;

    // Check cache
    const cachedData = cacheInstance.get(key);
    
    if (cachedData) {
      logger.debug('Cache hit', { key });
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data) => {
      if (res.statusCode === 200) {
        cacheInstance.set(key, data);
        logger.debug('Cache set', { key });
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Price cache middleware
 * Cache crypto prices for 5 seconds
 */
const cachePrices = cacheMiddleware(
  priceCache,
  (req) => `price_${req.params.symbol || req.query.symbol}`
);

/**
 * Market data cache middleware
 * Cache market data for 1 minute
 */
const cacheMarketData = cacheMiddleware(
  marketDataCache,
  (req) => `market_${req.originalUrl}`
);

/**
 * User data cache middleware
 * Cache user balance/portfolio for 5 minutes
 */
const cacheUserData = cacheMiddleware(
  userDataCache,
  (req) => `user_${req.user?.id}_${req.originalUrl}`
);

/**
 * Invalidate cache for specific key or pattern
 */
function invalidateCache(pattern) {
  const caches = [priceCache, marketDataCache, userDataCache];
  
  caches.forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
        logger.debug('Cache invalidated', { key });
      }
    });
  });
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  priceCache.flushAll();
  marketDataCache.flushAll();
  userDataCache.flushAll();
  logger.info('All caches cleared');
}

/**
 * Get cache stats
 */
function getCacheStats() {
  return {
    prices: priceCache.getStats(),
    marketData: marketDataCache.getStats(),
    userData: userDataCache.getStats()
  };
}

module.exports = {
  cachePrices,
  cacheMarketData,
  cacheUserData,
  invalidateCache,
  clearAllCaches,
  getCacheStats
};

