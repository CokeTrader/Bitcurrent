// Alpaca Crypto API Integration - Crypto-Only Broker
const Alpaca = require('@alpacahq/alpaca-trade-api');
require('dotenv').config();

// Initialize Alpaca client for crypto trading
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
  paper: process.env.ALPACA_PAPER === 'true', // Use paper trading for testing
  usePolygon: false // Use Alpaca data feed
});

// Supported crypto pairs on Alpaca
const SUPPORTED_PAIRS = [
  'BTCUSD',  // Bitcoin
  'ETHUSD',  // Ethereum
  'LTCUSD',  // Litecoin
  'BCHUSD',  // Bitcoin Cash
  'AAVEUSD', // Aave
  'UNIUSD',  // Uniswap
  'LINKUSD', // Chainlink
];

// Map our format (BTC-GBP) to Alpaca format (BTCUSD)
function toAlpacaSymbol(symbol) {
  // Convert BTC-GBP to BTCUSD
  const [base, quote] = symbol.split('-');
  return `${base}USD`; // Alpaca uses USD pairs
}

function fromAlpacaSymbol(alpacaSymbol) {
  // Convert BTCUSD to BTC-USD
  const base = alpacaSymbol.replace('USD', '');
  return `${base}-USD`;
}

/**
 * Test Alpaca connection
 */
async function testConnection() {
  try {
    const account = await alpaca.getAccount();
    console.log('✅ Alpaca API connected');
    console.log(`   Account Status: ${account.status}`);
    console.log(`   Buying Power: $${account.buying_power}`);
    console.log(`   Paper Trading: ${process.env.ALPACA_PAPER === 'true' ? 'Yes' : 'No'}`);
    return true;
  } catch (error) {
    console.error('❌ Alpaca API connection failed:', error.message);
    return false;
  }
}

/**
 * Get latest price for a crypto symbol
 * @param {string} symbol - Crypto symbol in our format (e.g., 'BTC-GBP')
 */
async function getPrice(symbol) {
  try {
    // Convert to Alpaca format (BTC-GBP -> BTCUSD)
    const alpacaSymbol = toAlpacaSymbol(symbol);
    
    console.log(`[Alpaca] Getting price for ${symbol} (${alpacaSymbol})`);
    
    // Try multiple methods to get price
    let priceUSD;
    
    try {
      // Method 1: Try Alpaca Data API v2 - Latest Crypto Quote
      const quote = await alpaca.getCryptoQuote(alpacaSymbol, 'us');
      priceUSD = parseFloat(quote.ap || quote.bp); // Ask price or Bid price
      console.log(`[Alpaca] Got price via getCryptoQuote: $${priceUSD}`);
    } catch (e1) {
      console.log(`[Alpaca] getCryptoQuote failed: ${e1.message}, trying alternative...`);
      
      try {
        // Method 2: Try Latest Trade
        const latestTrade = await alpaca.getLatestCryptoTrade(alpacaSymbol, 'us');
        priceUSD = parseFloat(latestTrade.p || latestTrade.Price);
        console.log(`[Alpaca] Got price via getLatestCryptoTrade: $${priceUSD}`);
      } catch (e2) {
        console.log(`[Alpaca] getLatestCryptoTrade failed: ${e2.message}, trying bars...`);
        
        // Method 3: Try Latest Bar (last resort)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const bars = await alpaca.getCryptoBars(
          alpacaSymbol,
          {
            start: yesterday.toISOString(),
            end: now.toISOString(),
            timeframe: '1Min',
            limit: 1
          },
          'us'
        );
        
        if (bars && bars[alpacaSymbol] && bars[alpacaSymbol].length > 0) {
          priceUSD = parseFloat(bars[alpacaSymbol][0].c); // Close price
          console.log(`[Alpaca] Got price via getCryptoBars: $${priceUSD}`);
        } else {
          throw new Error('No price data available from any Alpaca method');
        }
      }
    }
    
    if (!priceUSD || isNaN(priceUSD)) {
      throw new Error(`Invalid price received: ${priceUSD}`);
    }
    
    // Convert USD to GBP (using realistic exchange rate)
    const usdToGbp = 0.79; // 1 USD = 0.79 GBP (update this from a forex API ideally)
    const priceGBP = priceUSD * usdToGbp;
    
    console.log(`[Alpaca] Final price for ${symbol}: £${priceGBP.toFixed(2)} ($${priceUSD.toFixed(2)})`);
    
    return priceGBP;
  } catch (error) {
    console.error(`[Alpaca] getPrice error for ${symbol}:`, error.message);
    console.error(`[Alpaca] Full error:`, error);
    throw new Error(`Failed to get price for ${symbol}: ${error.message}`);
  }
}

/**
 * Get detailed quote for a crypto order
 * @param {string} symbol - Crypto symbol in our format (e.g., 'BTC-GBP')
 * @param {string} side - 'BUY' or 'SELL'
 * @param {number} amount - Amount (in GBP for BUY, in crypto for SELL)
 */
async function getQuote(symbol, side, amount) {
  try {
    // Get latest price in GBP
    const priceGBP = await getPrice(symbol);
    
    let baseAmount, quoteAmount;
    
    if (side.toUpperCase() === 'BUY') {
      // User wants to spend X GBP to buy crypto
      quoteAmount = amount; // GBP amount
      baseAmount = amount / priceGBP; // Crypto amount
    } else {
      // User wants to sell X crypto for GBP
      baseAmount = amount; // Crypto amount
      quoteAmount = amount * priceGBP; // GBP amount
    }
    
    // Calculate fee (0.25% - competitive with Alpaca's typical fee)
    const feePercent = 0.25;
    const fee = quoteAmount * (feePercent / 100);
    
    return {
      symbol,
      side: side.toUpperCase(),
      price: parseFloat(priceGBP.toFixed(2)),
      baseAmount: parseFloat(baseAmount.toFixed(8)), // Crypto amount
      quoteAmount: parseFloat(quoteAmount.toFixed(2)), // GBP amount
      fee: parseFloat(fee.toFixed(2)),
      feePercent,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Alpaca getQuote error:', error.message);
    throw new Error('Failed to get quote from Alpaca');
  }
}

/**
 * Place market order on Alpaca Crypto
 * @param {string} symbol - Crypto symbol in our format (e.g., 'BTC-GBP')
 * @param {string} side - 'buy' or 'sell'
 * @param {number} qty - Quantity in crypto (e.g., 0.001 BTC)
 */
async function placeMarketOrder(symbol, side, qty) {
  try {
    // Convert to Alpaca format (BTC-GBP -> BTCUSD)
    const alpacaSymbol = toAlpacaSymbol(symbol);
    
    const orderParams = {
      symbol: alpacaSymbol,
      qty: qty.toFixed(8), // Alpaca requires string with proper decimals
      side: side.toLowerCase(),
      type: 'market',
      time_in_force: 'gtc' // Good till cancelled (crypto trades 24/7)
    };
    
    const order = await alpaca.createOrder(orderParams);
    
    return {
      orderId: order.id,
      clientOrderId: order.client_order_id,
      symbol: fromAlpacaSymbol(order.symbol), // Convert back to our format
      side: order.side.toUpperCase(),
      orderType: order.type,
      qty: parseFloat(order.qty),
      filledQty: parseFloat(order.filled_qty || 0),
      filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
      status: order.status,
      submittedAt: order.submitted_at,
      filledAt: order.filled_at
    };
  } catch (error) {
    console.error('Alpaca placeMarketOrder error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to place order on Alpaca');
  }
}

/**
 * Get order status
 * @param {string} orderId - Alpaca order ID
 */
async function getOrder(orderId) {
  try {
    const order = await alpaca.getOrder(orderId);
    
    return {
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      qty: parseFloat(order.qty),
      filledQty: parseFloat(order.filled_qty || 0),
      filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
      status: order.status,
      submittedAt: order.submitted_at,
      filledAt: order.filled_at,
      assetClass: order.asset_class
    };
  } catch (error) {
    console.error('Alpaca getOrder error:', error.message);
    throw new Error('Failed to get order from Alpaca');
  }
}

/**
 * Get account information
 */
async function getAccount() {
  try {
    const account = await alpaca.getAccount();
    
    return {
      accountNumber: account.account_number,
      status: account.status,
      currency: account.currency,
      cash: parseFloat(account.cash),
      buyingPower: parseFloat(account.buying_power),
      portfolioValue: parseFloat(account.portfolio_value),
      equity: parseFloat(account.equity),
      lastEquity: parseFloat(account.last_equity),
      multiplier: account.multiplier,
      daytradeCount: account.daytradeCount,
      patternDayTrader: account.pattern_day_trader
    };
  } catch (error) {
    console.error('Alpaca getAccount error:', error.message);
    throw new Error('Failed to get account info from Alpaca');
  }
}

/**
 * Get all positions (holdings)
 */
async function getPositions() {
  try {
    const positions = await alpaca.getPositions();
    
    return positions.map(p => ({
      symbol: p.symbol,
      assetClass: p.asset_class,
      qty: parseFloat(p.qty),
      availableQty: parseFloat(p.qty_available || p.qty),
      marketValue: parseFloat(p.market_value),
      costBasis: parseFloat(p.cost_basis),
      averageEntryPrice: parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      unrealizedPL: parseFloat(p.unrealized_pl),
      unrealizedPLPercent: parseFloat(p.unrealized_plpc),
      side: p.side,
      exchange: p.exchange
    }));
  } catch (error) {
    console.error('Alpaca getPositions error:', error.message);
    throw new Error('Failed to get positions from Alpaca');
  }
}

/**
 * Get position for specific symbol
 * @param {string} symbol - Stock symbol
 */
async function getPosition(symbol) {
  try {
    const position = await alpaca.getPosition(symbol);
    
    return {
      symbol: position.symbol,
      assetClass: position.asset_class,
      qty: parseFloat(position.qty),
      availableQty: parseFloat(position.qty_available || position.qty),
      marketValue: parseFloat(position.market_value),
      costBasis: parseFloat(position.cost_basis),
      averageEntryPrice: parseFloat(position.avg_entry_price),
      currentPrice: parseFloat(position.current_price),
      unrealizedPL: parseFloat(position.unrealized_pl),
      unrealizedPLPercent: parseFloat(position.unrealized_plpc),
      side: position.side,
      exchange: position.exchange
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No position
    }
    console.error('Alpaca getPosition error:', error.message);
    throw new Error(`Failed to get position for ${symbol}`);
  }
}

/**
 * Get supported crypto pairs
 */
function getSupportedPairs() {
  return SUPPORTED_PAIRS.map(pair => fromAlpacaSymbol(pair));
}

/**
 * Check if trading pair is supported
 */
function isSupported(symbol) {
  const alpacaSymbol = toAlpacaSymbol(symbol);
  return SUPPORTED_PAIRS.includes(alpacaSymbol);
}

module.exports = {
  testConnection,
  getPrice,
  getQuote,
  placeMarketOrder,
  getOrder,
  getAccount,
  getPositions,
  getPosition,
  getSupportedPairs,
  isSupported
};

