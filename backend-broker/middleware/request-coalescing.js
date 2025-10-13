/**
 * Request Coalescing Middleware
 * Prevent duplicate simultaneous requests to same endpoint
 */

const logger = require('../utils/logger');

class RequestCoalescer {
  constructor() {
    this.pending = new Map(); // endpoint -> Promise
  }

  middleware() {
    return async (req, res, next) => {
      // Only coalesce GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `${req.path}:${JSON.stringify(req.query)}`;
      
      // Check if request already pending
      if (this.pending.has(key)) {
        logger.debug('Coalescing duplicate request', { key });
        
        try {
          // Wait for pending request to complete
          const result = await this.pending.get(key);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({ error: 'Request failed' });
        }
      }

      // Create promise for this request
      const promise = new Promise((resolve, reject) => {
        const originalJson = res.json.bind(res);
        
        res.json = function(data) {
          resolve(data);
          requestCoalescer.pending.delete(key);
          return originalJson(data);
        };

        const originalStatus = res.status.bind(res);
        res.status = function(code) {
          if (code >= 400) {
            requestCoalescer.pending.delete(key);
          }
          return originalStatus(code);
        };
      });

      this.pending.set(key, promise);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        this.pending.delete(key);
      }, 10000);

      next();
    };
  }
}

const requestCoalescer = new RequestCoalescer();

module.exports = requestCoalescer;

