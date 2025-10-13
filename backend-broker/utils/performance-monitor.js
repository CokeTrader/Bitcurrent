/**
 * Performance Monitoring Utility
 * Track API response times and system metrics
 */

const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      slowRequests: []
    };
  }

  /**
   * Middleware to track request performance
   */
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.recordRequest(req, res, duration);
      });

      next();
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(req, res, duration) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;

    // Track errors
    if (res.statusCode >= 400) {
      this.metrics.errors++;
    }

    // Track slow requests (> 1s)
    if (duration > 1000) {
      this.metrics.slowRequests.push({
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        timestamp: new Date()
      });

      // Keep only last 100 slow requests
      if (this.metrics.slowRequests.length > 100) {
        this.metrics.slowRequests.shift();
      }

      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`
      });
    }

    // Log extremely slow requests (> 5s)
    if (duration > 5000) {
      logger.error('Extremely slow request', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.requests > 0
      ? this.metrics.totalResponseTime / this.metrics.requests
      : 0;

    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errors / this.metrics.requests) * 100
      : 0;

    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: errorRate.toFixed(2) + '%',
      slowRequests: this.metrics.slowRequests.length,
      recentSlowRequests: this.metrics.slowRequests.slice(-10)
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      slowRequests: []
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;

