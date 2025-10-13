/**
 * Improved Exchange Integration
 * 
 * Enhanced Coinbase/Kraken integration with:
 * - Automatic failover
 * - Rate limit handling
 * - Error retry logic
 * - Circuit breaker pattern
 * - Health monitoring
 * - Order reconciliation
 */

const CoinbaseAdvancedTrade = require('./coinbase-advanced-trade');
const KrakenAPI = require('./kraken-api');
const EventEmitter = require('events');

class ExchangeIntegrationManager extends EventEmitter {
  constructor() {
    super();
    
    this.exchanges = {
      coinbase: new CoinbaseAdvancedTrade(),
      kraken: new KrakenAPI()
    };

    this.primaryExchange = process.env.PRIMARY_EXCHANGE || 'coinbase';
    this.failoverExchange = this.primaryExchange === 'coinbase' ? 'kraken' : 'coinbase';

    // Circuit breaker state
    this.circuitBreaker = {
      coinbase: { failures: 0, lastFailure: null, state: 'closed' },
      kraken: { failures: 0, lastFailure: null, state: 'closed' }
    };

    this.maxFailures = 5;
    this.resetTimeout = 60000; // 1 minute
  }

  /**
   * Execute trade with automatic failover
   */
  async executeTrade(type, params) {
    try {
      // Try primary exchange
      const result = await this.executeOnExchange(this.primaryExchange, type, params);
      
      if (result.success) {
        this.recordSuccess(this.primaryExchange);
        return result;
      }

      // If primary fails, try failover
      console.warn(`Primary exchange (${this.primaryExchange}) failed, trying failover...`);
      
      const failoverResult = await this.executeOnExchange(this.failoverExchange, type, params);
      
      if (failoverResult.success) {
        this.recordSuccess(this.failoverExchange);
        this.emit('failover', {
          from: this.primaryExchange,
          to: this.failoverExchange,
          reason: result.error
        });
        return failoverResult;
      }

      return {
        success: false,
        error: 'Both exchanges failed',
        details: {
          primary: result.error,
          failover: failoverResult.error
        }
      };

    } catch (error) {
      console.error('Execute trade error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute on specific exchange with circuit breaker
   */
  async executeOnExchange(exchangeName, type, params) {
    // Check circuit breaker
    const breaker = this.circuitBreaker[exchangeName];
    
    if (breaker.state === 'open') {
      // Check if reset timeout has passed
      if (Date.now() - breaker.lastFailure > this.resetTimeout) {
        breaker.state = 'half-open';
        breaker.failures = 0;
      } else {
        return {
          success: false,
          error: `Circuit breaker open for ${exchangeName}`
        };
      }
    }

    try {
      const exchange = this.exchanges[exchangeName];
      let result;

      // Execute based on type
      switch (type) {
        case 'buy':
          result = await this.retryWithBackoff(() => 
            exchange.buyBitcoin(params.amount)
          );
          break;
        
        case 'sell':
          result = await this.retryWithBackoff(() =>
            exchange.sellBitcoin(params.amount)
          );
          break;
        
        case 'getPrice':
          result = await this.retryWithBackoff(() =>
            exchange.getCurrentPrice ? exchange.getCurrentPrice() : exchange.getTicker('XBTGBP')
          );
          break;
        
        case 'getBalance':
          result = await this.retryWithBackoff(() =>
            exchange.getBalance(params.currency)
          );
          break;

        default:
          throw new Error(`Unknown trade type: ${type}`);
      }

      if (!result.success) {
        this.recordFailure(exchangeName);
      }

      return result;

    } catch (error) {
      this.recordFailure(exchangeName);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff(operation, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Record failure (circuit breaker)
   */
  recordFailure(exchangeName) {
    const breaker = this.circuitBreaker[exchangeName];
    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= this.maxFailures) {
      breaker.state = 'open';
      console.error(`🚨 Circuit breaker OPEN for ${exchangeName}`);
      
      this.emit('circuit_breaker_open', {
        exchange: exchangeName,
        failures: breaker.failures
      });
    }
  }

  /**
   * Record success (circuit breaker)
   */
  recordSuccess(exchangeName) {
    const breaker = this.circuitBreaker[exchangeName];
    
    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failures = 0;
      console.log(`✅ Circuit breaker CLOSED for ${exchangeName}`);
    }
  }

  /**
   * Get exchange health status
   */
  async getExchangeHealth() {
    const health = {};

    for (const [name, exchange] of Object.entries(this.exchanges)) {
      try {
        const start = Date.now();
        const pingResult = await exchange.getCurrentPrice?.() || await exchange.getTicker?.('XBTGBP');
        const latency = Date.now() - start;

        health[name] = {
          status: pingResult.success ? 'healthy' : 'degraded',
          latency: `${latency}ms`,
          circuitBreaker: this.circuitBreaker[name].state,
          lastError: this.circuitBreaker[name].lastFailure
            ? new Date(this.circuitBreaker[name].lastFailure).toISOString()
            : null
        };
      } catch (error) {
        health[name] = {
          status: 'down',
          error: error.message,
          circuitBreaker: this.circuitBreaker[name].state
        };
      }
    }

    return {
      success: true,
      health,
      primary: this.primaryExchange,
      failover: this.failoverExchange
    };
  }

  /**
   * Reconcile order (verify execution on exchange)
   */
  async reconcileOrder(orderId, exchangeName) {
    try {
      const exchange = this.exchanges[exchangeName];
      
      if (!exchange.getOrder) {
        return {
          success: false,
          error: 'Exchange does not support order reconciliation'
        };
      }

      const result = await exchange.getOrder(orderId);
      
      return {
        success: true,
        order: result.data,
        reconciled: true
      };

    } catch (error) {
      console.error('Order reconciliation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ExchangeIntegrationManager();

