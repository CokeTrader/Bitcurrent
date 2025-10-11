// Binance API Integration
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;
const BINANCE_TESTNET = process.env.BINANCE_TESTNET === 'true';

// API endpoints
const BASE_URL = BINANCE_TESTNET 
  ? 'https://testnet.binance.vision/api'
  : 'https://api.binance.com/api';

// Create axios instance
const binanceClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-MBX-APIKEY': BINANCE_API_KEY
  },
  timeout: 10000
});

// Sign request for authenticated endpoints
function signRequest(queryString) {
  return crypto
    .createHmac('sha256', BINANCE_API_SECRET)
    .update(queryString)
    .digest('hex');
}

// Build query string with signature
function buildSignedQuery(params) {
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  const signature = signRequest(queryString);
  return `${queryString}&signature=${signature}`;
}

/**
 * Get current price for a symbol
 */
async function getPrice(symbol) {
  try {
    const response = await binanceClient.get('/v3/ticker/price', {
      params: { symbol }
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error('Binance getPrice error:', error.response?.data || error.message);
    throw new Error(`Failed to get price for ${symbol}`);
  }
}

/**
 * Get quote for market order
 * @param {string} symbol - Trading pair (e.g., 'BTCGBP')
 * @param {string} side - 'BUY' or 'SELL'
 * @param {number} amount - Amount in quote currency (GBP) for BUY, base currency for SELL
 * @returns {object} Quote with price, amount, fee
 */
async function getQuote(symbol, side, amount) {
  try {
    const price = await getPrice(symbol);
    
    let quoteAmount, baseAmount;
    if (side === 'BUY') {
      // User wants to spend X GBP to buy crypto
      quoteAmount = amount;
      baseAmount = amount / price;
    } else {
      // User wants to sell X crypto for GBP
      baseAmount = amount;
      quoteAmount = amount * price;
    }
    
    // Calculate fee (0.1% for broker)
    const fee = quoteAmount * 0.001; // 0.1% fee
    
    return {
      symbol,
      side,
      price,
      baseAmount: parseFloat(baseAmount.toFixed(8)),
      quoteAmount: parseFloat(quoteAmount.toFixed(2)),
      fee: parseFloat(fee.toFixed(2)),
      feePercent: 0.1,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Binance getQuote error:', error.message);
    throw new Error('Failed to get quote from Binance');
  }
}

/**
 * Place market order on Binance
 * @param {string} symbol - Trading pair (e.g., 'BTCGBP')
 * @param {string} side - 'BUY' or 'SELL'
 * @param {number} quoteAmount - Amount in GBP for BUY orders
 * @param {number} baseAmount - Amount in crypto for SELL orders
 * @returns {object} Order result
 */
async function placeMarketOrder(symbol, side, quoteAmount = null, baseAmount = null) {
  try {
    const params = {
      symbol,
      side,
      type: 'MARKET',
      timestamp: Date.now()
    };
    
    // For BUY: specify quoteOrderQty (amount in GBP)
    // For SELL: specify quantity (amount in crypto)
    if (side === 'BUY' && quoteAmount) {
      params.quoteOrderQty = quoteAmount.toFixed(2);
    } else if (side === 'SELL' && baseAmount) {
      params.quantity = baseAmount.toFixed(8);
    } else {
      throw new Error('Invalid order parameters');
    }
    
    const queryString = buildSignedQuery(params);
    
    const response = await binanceClient.post(`/v3/order?${queryString}`);
    
    const data = response.data;
    
    // Calculate executed amounts
    const executedQty = parseFloat(data.executedQty);
    const cummulativeQuoteQty = parseFloat(data.cummulativeQuoteQty);
    const avgPrice = cummulativeQuoteQty / executedQty;
    
    return {
      orderId: data.orderId.toString(),
      symbol: data.symbol,
      side: data.side,
      status: data.status,
      executedQty,
      cummulativeQuoteQty,
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      fills: data.fills,
      transactTime: data.transactTime
    };
  } catch (error) {
    console.error('Binance placeMarketOrder error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.msg || 'Failed to place order on Binance');
  }
}

/**
 * Get account balances from Binance
 */
async function getBalances() {
  try {
    const params = {
      timestamp: Date.now()
    };
    
    const queryString = buildSignedQuery(params);
    
    const response = await binanceClient.get(`/v3/account?${queryString}`);
    
    const balances = response.data.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked)
      }));
    
    return balances;
  } catch (error) {
    console.error('Binance getBalances error:', error.response?.data || error.message);
    throw new Error('Failed to get Binance balances');
  }
}

/**
 * Test API connection
 */
async function testConnection() {
  try {
    const response = await binanceClient.get('/v3/ping');
    console.log('✅ Binance API connection successful');
    return true;
  } catch (error) {
    console.error('❌ Binance API connection failed:', error.message);
    return false;
  }
}

/**
 * Get exchange info (trading rules, limits)
 */
async function getExchangeInfo(symbol = null) {
  try {
    const params = symbol ? { symbol } : {};
    const response = await binanceClient.get('/v3/exchangeInfo', { params });
    return response.data;
  } catch (error) {
    console.error('Binance getExchangeInfo error:', error.message);
    throw new Error('Failed to get exchange info');
  }
}

module.exports = {
  getPrice,
  getQuote,
  placeMarketOrder,
  getBalances,
  testConnection,
  getExchangeInfo
};

