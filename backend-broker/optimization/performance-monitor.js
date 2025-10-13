/**
 * Real-time Performance Monitoring
 * 
 * Track and optimize system performance:
 * - Response times
 * - Database query times
 * - Memory usage
 * - CPU usage
 * - Error rates
 * - Request throughput
 */

const os = require('os');
const pool = require('../config/database');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.startTime = Date.now();
    this.requestTimes = [];
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
        
        this.metrics.requests++;
        this.metrics.totalResponseTime += duration;
        this.requestTimes.push(duration);

        // Keep only last 1000 request times
        if (this.requestTimes.length > 1000) {
          this.requestTimes.shift();
        }

        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }

        // Log slow requests
        if (duration > 1000) {
          console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
      });

      next();
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const uptime = (Date.now() - this.startTime) / 1000; // seconds
    const avgResponseTime = this.metrics.requests > 0
      ? (this.metrics.totalResponseTime / this.metrics.requests).toFixed(2)
      : 0;

    // Calculate percentiles
    const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedTimes, 50);
    const p95 = this.getPercentile(sortedTimes, 95);
    const p99 = this.getPercentile(sortedTimes, 99);

    return {
      uptime: `${Math.floor(uptime)}s`,
      requests: {
        total: this.metrics.requests,
        perSecond: (this.metrics.requests / uptime).toFixed(2),
        errors: this.metrics.errors,
        errorRate: this.metrics.requests > 0
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
          : '0%'
      },
      responseTime: {
        average: `${avgResponseTime}ms`,
        p50: `${p50}ms`,
        p95: `${p95}ms`,
        p99: `${p99}ms`
      },
      system: this.getSystemMetrics(),
      database: this.getDatabaseMetrics()
    };
  }

  /**
   * Get percentile value
   */
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        cores: os.cpus().length,
        load: os.loadavg(),
        model: os.cpus()[0]?.model
      },
      memory: {
        total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usage: `${((usedMem / totalMem) * 100).toFixed(2)}%`
      },
      platform: os.platform(),
      uptime: `${Math.floor(os.uptime() / 60)} minutes`
    };
  }

  /**
   * Get database metrics
   */
  getDatabaseMetrics() {
    return {
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount
    };
  }

  /**
   * Track slow query
   */
  trackSlowQuery(query, duration) {
    if (duration > 100) {
      this.metrics.slowQueries++;
      console.warn(`🐌 Slow query (${duration}ms): ${query.substring(0, 100)}...`);
    }
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.requestTimes = [];
    this.startTime = Date.now();

    return {
      success: true,
      message: 'Metrics reset'
    };
  }
}

module.exports = new PerformanceMonitor();

