/**
 * CoinMarketCap Integration
 * Real market data and cryptocurrency information
 */

const axios = require('axios');
const logger = require('../utils/logger');
const cache = require('../config/redis');

class CoinMarketCapIntegration {
  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY;
    this.baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  }

  /**
   * Get cryptocurrency quotes
   */
  async getQuotes(symbols) {
    const cacheKey = `cmc:quotes:${symbols.join(',')}`;
    
    // Try cache first (5 minute TTL)
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/quotes/latest`, {
        params: { symbol: symbols.join(','), convert: 'USD' },
        headers: { 'X-CMC_PRO_API_KEY': this.apiKey }
      });

      const quotes = response.data.data;
      
      // Cache for 5 minutes
      await cache.set(cacheKey, quotes, 300);
      
      return quotes;
    } catch (error) {
      logger.error('CoinMarketCap API error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get global market metrics
   */
  async getGlobalMetrics() {
    const cacheKey = 'cmc:global';
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/global-metrics/quotes/latest`, {
        headers: { 'X-CMC_PRO_API_KEY': this.apiKey }
      });

      const metrics = response.data.data;
      
      // Cache for 10 minutes
      await cache.set(cacheKey, metrics, 600);
      
      return metrics;
    } catch (error) {
      logger.error('Failed to get global metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cryptocurrency metadata
   */
  async getMetadata(symbols) {
    const cacheKey = `cmc:metadata:${symbols.join(',')}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/info`, {
        params: { symbol: symbols.join(',') },
        headers: { 'X-CMC_PRO_API_KEY': this.apiKey }
      });

      const metadata = response.data.data;
      
      // Cache for 24 hours
      await cache.set(cacheKey, metadata, 86400);
      
      return metadata;
    } catch (error) {
      logger.error('Failed to get metadata', { error: error.message });
      throw error;
    }
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit = 100) {
    const cacheKey = `cmc:top:${limit}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/cryptocurrency/listings/latest`, {
        params: { limit, convert: 'USD' },
        headers: { 'X-CMC_PRO_API_KEY': this.apiKey }
      });

      const cryptos = response.data.data;
      
      // Cache for 5 minutes
      await cache.set(cacheKey, cryptos, 300);
      
      return cryptos;
    } catch (error) {
      logger.error('Failed to get top cryptos', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CoinMarketCapIntegration();

