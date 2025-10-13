/**
 * Market Data API Routes
 */

const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache-middleware');
const logger = require('../utils/logger');

// Mock market data (in production, fetch from Alpaca)
const MARKETS = {
  'BTCUSD': { name: 'Bitcoin', basePrice: 67234.50 },
  'ETHUSD': { name: 'Ethereum', basePrice: 3567.89 },
  'SOLUSD': { name: 'Solana', basePrice: 145.67 },
  'ADAUSD': { name: 'Cardano', basePrice: 0.52 },
  'DOTUSD': { name: 'Polkadot', basePrice: 7.89 }
};

/**
 * GET /api/v1/markets
 * Get all available markets with 24h stats
 */
router.get('/', cacheMiddleware(60), (req, res) => {
  const markets = Object.entries(MARKETS).map(([symbol, data]) => {
    const change = (Math.random() - 0.5) * 10;
    const price = data.basePrice * (1 + change / 100);
    
    return {
      pair: symbol.replace('USD', '/USD'),
      symbol,
      name: data.name,
      lastPrice: parseFloat(price.toFixed(2)),
      change24h: parseFloat(change.toFixed(2)),
      volume24h: Math.random() * 10000000,
      high24h: price * 1.05,
      low24h: price * 0.95,
      marketCap: price * 19000000 // Mock market cap
    };
  });

  res.json({
    success: true,
    markets,
    count: markets.length,
    timestamp: Date.now()
  });
});

/**
 * GET /api/v1/markets/:symbol/ticker
 * Get ticker for specific market
 */
router.get('/:symbol/ticker', cacheMiddleware(5), (req, res) => {
  const { symbol } = req.params;
  const market = MARKETS[symbol.toUpperCase()];

  if (!market) {
    return res.status(404).json({
      error: 'Market not found',
      code: 'MARKET_NOT_FOUND'
    });
  }

  const change = (Math.random() - 0.5) * 10;
  const price = market.basePrice * (1 + change / 100);

  res.json({
    success: true,
    ticker: {
      symbol,
      pair: symbol.replace('USD', '/USD'),
      name: market.name,
      price: parseFloat(price.toFixed(2)),
      change24h: parseFloat(change.toFixed(2)),
      high24h: price * 1.05,
      low24h: price * 0.95,
      volume24h: Math.random() * 10000000,
      bid: price * 0.999,
      ask: price * 1.001,
      timestamp: Date.now()
    }
  });
});

/**
 * GET /api/v1/markets/:symbol/orderbook
 * Get order book depth
 */
router.get('/:symbol/orderbook', cacheMiddleware(10), (req, res) => {
  const { symbol } = req.params;
  const { depth = 20 } = req.query;
  const market = MARKETS[symbol.toUpperCase()];

  if (!market) {
    return res.status(404).json({
      error: 'Market not found',
      code: 'MARKET_NOT_FOUND'
    });
  }

  const price = market.basePrice;
  const maxDepth = Math.min(parseInt(depth), 100);

  // Generate mock order book
  const bids = [];
  const asks = [];

  for (let i = 0; i < maxDepth; i++) {
    bids.push([
      (price * (1 - (i * 0.0001))).toFixed(2),
      (Math.random() * 10).toFixed(8)
    ]);
    asks.push([
      (price * (1 + (i * 0.0001))).toFixed(2),
      (Math.random() * 10).toFixed(8)
    ]);
  }

  res.json({
    success: true,
    orderbook: {
      symbol,
      bids,
      asks,
      timestamp: Date.now()
    }
  });
});

/**
 * GET /api/v1/markets/:symbol/trades
 * Get recent trades
 */
router.get('/:symbol/trades', cacheMiddleware(5), (req, res) => {
  const { symbol } = req.params;
  const { limit = 50 } = req.query;
  const market = MARKETS[symbol.toUpperCase()];

  if (!market) {
    return res.status(404).json({
      error: 'Market not found',
      code: 'MARKET_NOT_FOUND'
    });
  }

  const trades = [];
  const maxLimit = Math.min(parseInt(limit), 500);
  const basePrice = market.basePrice;

  for (let i = 0; i < maxLimit; i++) {
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    trades.push({
      id: `trade_${Date.now()}_${i}`,
      price: parseFloat(price.toFixed(2)),
      amount: parseFloat((Math.random() * 1).toFixed(8)),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: Date.now() - (i * 1000)
    });
  }

  res.json({
    success: true,
    trades,
    count: trades.length
  });
});

/**
 * GET /api/v1/markets/:symbol/candles
 * Get OHLCV candles
 */
router.get('/:symbol/candles', cacheMiddleware(60), (req, res) => {
  const { symbol } = req.params;
  const { interval = '1h', limit = 100 } = req.query;
  const market = MARKETS[symbol.toUpperCase()];

  if (!market) {
    return res.status(404).json({
      error: 'Market not found',
      code: 'MARKET_NOT_FOUND'
    });
  }

  const candles = [];
  const maxLimit = Math.min(parseInt(limit), 1000);
  const basePrice = market.basePrice;
  const now = Date.now();

  for (let i = 0; i < maxLimit; i++) {
    const open = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const high = open * (1 + Math.random() * 0.01);
    const low = open * (1 - Math.random() * 0.01);
    const close = low + (high - low) * Math.random();

    candles.push({
      timestamp: now - (i * 3600000), // 1 hour intervals
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat((Math.random() * 100).toFixed(2))
    });
  }

  res.json({
    success: true,
    candles: candles.reverse(),
    interval,
    count: candles.length
  });
});

module.exports = router;

