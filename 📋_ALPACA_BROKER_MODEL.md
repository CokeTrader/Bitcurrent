# 📋 BitCurrent + Alpaca Broker Model

## Why Alpaca is Perfect for You

### Advantages Over Binance
✅ **Stocks + Crypto**: Trade stocks, ETFs, AND crypto (all in one platform)
✅ **UK Friendly**: US-based, regulated, easier than crypto-only
✅ **Commission-Free**: $0 commissions on stocks/crypto
✅ **Fractional Shares**: Let users buy £10 of Apple stock
✅ **Better For Growth**: Stocks are less volatile than crypto-only
✅ **Broker API**: Built specifically for your use case
✅ **Paper Trading**: Free sandbox for testing

### What You Can Offer
- **US Stocks**: Apple, Tesla, Microsoft, Amazon, etc.
- **ETFs**: S&P 500, NASDAQ, sector funds
- **Crypto**: Bitcoin, Ethereum (via Alpaca Crypto)
- **Fractional Trading**: Buy 0.01 shares of expensive stocks

---

## Alpaca Broker API Overview

### How It Works
1. **You** apply for Alpaca Broker API
2. **Your users** get sub-accounts under your master account
3. **Orders** route through Alpaca to exchanges
4. **You** earn revenue via:
   - Spread markup (optional)
   - Subscription fees
   - Payment for order flow (PFOF)
   - Interest on cash balances

### Alpaca Broker Tiers

| Tier | Cost | Features |
|------|------|----------|
| **Sandbox** | Free | Paper trading, testing |
| **Production** | $99-299/month | Real trading, up to 100 users |
| **Enterprise** | Custom | Unlimited users, white-label |

**Start with Sandbox (Free) → Move to Production when you have 20+ users**

---

## Updated Architecture (Alpaca Version)

### Backend Changes Needed

```javascript
// backend-broker/services/alpaca.js (NEW)

const Alpaca = require('@alpacahq/alpaca-trade-api');

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
  paper: process.env.ALPACA_PAPER === 'true', // Sandbox mode
  feed: 'iex' // Or 'sip' for pro data
});

/**
 * Get real-time quote for stock or crypto
 */
async function getQuote(symbol, assetType = 'stock') {
  if (assetType === 'crypto') {
    // Crypto quote (e.g., BTC/USD)
    const quote = await alpaca.getCryptoBars(symbol, {
      timeframe: '1Min',
      limit: 1
    });
    return {
      symbol,
      price: quote[symbol][0].c, // Close price
      bid: quote[symbol][0].l,   // Low as bid proxy
      ask: quote[symbol][0].h,   // High as ask proxy
      timestamp: quote[symbol][0].t
    };
  } else {
    // Stock quote
    const quote = await alpaca.getLatestTrade(symbol);
    return {
      symbol,
      price: quote.price,
      bid: quote.price * 0.999, // Approximate
      ask: quote.price * 1.001,
      timestamp: quote.timestamp
    };
  }
}

/**
 * Place market order
 */
async function placeMarketOrder(userId, symbol, side, qty, assetType = 'stock') {
  // Create order for user's sub-account
  const order = await alpaca.createOrder({
    symbol: symbol,
    qty: qty, // Can be fractional: 0.5 shares
    side: side.toLowerCase(), // 'buy' or 'sell'
    type: 'market',
    time_in_force: 'day',
    // For sub-accounts: account_id: userAlpacaAccountId
  });
  
  return {
    orderId: order.id,
    symbol: order.symbol,
    side: order.side,
    qty: order.qty,
    filledQty: order.filled_qty,
    filledPrice: order.filled_avg_price,
    status: order.status
  };
}

/**
 * Get account positions
 */
async function getPositions(userId) {
  const positions = await alpaca.getPositions();
  return positions.map(p => ({
    symbol: p.symbol,
    qty: parseFloat(p.qty),
    marketValue: parseFloat(p.market_value),
    costBasis: parseFloat(p.cost_basis),
    unrealizedPL: parseFloat(p.unrealized_pl),
    unrealizedPLPercent: parseFloat(p.unrealized_plpc)
  }));
}

/**
 * Get account balance
 */
async function getAccountBalance(userId) {
  const account = await alpaca.getAccount();
  return {
    cash: parseFloat(account.cash),
    buyingPower: parseFloat(account.buying_power),
    portfolioValue: parseFloat(account.portfolio_value),
    equity: parseFloat(account.equity)
  };
}

module.exports = {
  getQuote,
  placeMarketOrder,
  getPositions,
  getAccountBalance
};
```

---

## Database Schema Updates

### Add New Tables

```sql
-- Asset types (stocks, crypto, ETFs)
CREATE TABLE asset_types (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO asset_types VALUES
('stock', 'Stocks', 'US equities'),
('crypto', 'Cryptocurrency', 'Digital assets'),
('etf', 'ETFs', 'Exchange-traded funds');

-- Update orders table to support stocks
ALTER TABLE orders 
ADD COLUMN asset_type VARCHAR(20) REFERENCES asset_types(id) DEFAULT 'crypto',
ADD COLUMN fractional_qty BOOLEAN DEFAULT FALSE,
ADD COLUMN alpaca_order_id VARCHAR(100);

-- User portfolios (holdings)
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(20) REFERENCES asset_types(id),
    quantity NUMERIC(20, 8) NOT NULL,
    average_cost NUMERIC(20, 8),
    current_price NUMERIC(20, 8),
    market_value NUMERIC(20, 8),
    unrealized_pl NUMERIC(20, 8),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, symbol, asset_type)
);

-- Watchlists
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(20) REFERENCES asset_types(id),
    added_at TIMESTAMP DEFAULT NOW()
);
```

---

## Updated Revenue Model

### Option 1: Markup on Spread (Simple)
- Buy from Alpaca at $100.00
- Sell to user at $100.10 (0.1% markup)
- **Revenue**: $0.10 per share

### Option 2: Flat Commission
- Charge £0.99 per trade (like Freetrade)
- Or 0.25% per trade
- Alpaca is free, you keep all commission

### Option 3: Subscription (Best for Growth)
- **Free Tier**: 1 free trade/month, stocks only
- **Basic Tier**: £4.99/month, unlimited stocks
- **Premium Tier**: £9.99/month, stocks + crypto + fractional
- **Pro Tier**: £19.99/month, advanced features

### Option 4: Hybrid (Recommended)
- Free trades (compete with Freetrade/Trading212)
- Earn from:
  - Premium subscription (£4.99-9.99/month)
  - Interest on cash (Alpaca pays you ~4%)
  - FX spread (GBP → USD conversion: 0.5%)

**Example Revenue**:
- 1,000 users × £4.99/month = £4,990/month
- Plus interest on £100k cash = £330/month
- **Total**: ~£5,300/month

---

## Cost Breakdown (Alpaca Model)

| Item | Cost | Notes |
|------|------|-------|
| **Railway (Backend)** | £15/month | Same |
| **Vercel (Frontend)** | £0/month | Same |
| **Alpaca Broker API** | £0-£299/month | Free sandbox → £99 production |
| **Market Data** | £0-£50/month | IEX free, SIP £50/month |
| **KYC (Sumsub)** | £1.50/user | Pay as you go |
| **TOTAL (Sandbox)** | **£15/month** | While testing |
| **TOTAL (Production)** | **£114/month** | When live |

Still 30% cheaper than the old setup (£155/month)!

---

## What You Can Offer Users

### Investment Products
1. **US Stocks**
   - Apple (AAPL)
   - Tesla (TSLA)
   - Microsoft (MSFT)
   - Amazon (AMZN)
   - Google (GOOGL)
   - 5,000+ more

2. **ETFs**
   - S&P 500 (SPY)
   - NASDAQ (QQQ)
   - Total Market (VTI)
   - International (VXUS)

3. **Crypto**
   - Bitcoin (BTC)
   - Ethereum (ETH)
   - Others via Alpaca Crypto

4. **Fractional Shares**
   - Buy £10 of Amazon (instead of £3,000 for 1 share)
   - Perfect for small investors

---

## Marketing Positioning

### Your Unique Value Prop
"**BitCurrent: Invest in stocks, ETFs & crypto - all in one place**"

**Competitor Comparison**:

| Feature | BitCurrent | Freetrade | Trading 212 | Coinbase |
|---------|-----------|-----------|-------------|----------|
| UK Stocks | ❌ | ✅ | ✅ | ❌ |
| US Stocks | ✅ | ✅ | ✅ | ❌ |
| Crypto | ✅ | ❌ | ❌ | ✅ |
| Fractional | ✅ | ✅ | ✅ | ✅ |
| Commission | £0* | £0 | £0 | 0.5% |
| Crypto Fee | 0.5% | N/A | N/A | 1.49% |
| ISA | Soon | ✅ | ✅ | ❌ |

*Free with Premium (£4.99/month)

---

## Implementation Steps

### Step 1: Apply for Alpaca Broker API (1 hour)
1. Go to: https://alpaca.markets/broker
2. Fill out application:
   - Business type: Financial Services
   - Use case: UK investment platform
   - Expected users: 100-1,000 first year
3. Wait 3-7 days for approval

### Step 2: Update Backend (4 hours)
```bash
cd backend-broker

# Install Alpaca SDK
npm install @alpacahq/alpaca-trade-api

# Create new service
# (I'll provide the code below)

# Update routes to support stocks
# (I'll provide the code below)

# Test in sandbox mode
```

### Step 3: Update Frontend (3 hours)
- Add stock search
- Show stock prices (real-time)
- Trading interface for stocks
- Portfolio view (stocks + crypto)
- Watchlists

### Step 4: Test with Paper Trading (2 hours)
- Create test account
- Place test orders
- Verify fills
- Check portfolio updates

### Step 5: Go Live (1 hour)
- Switch to production API keys
- Enable real trading
- Launch!

---

## Example User Flow (Stocks)

### Buying Apple Stock
1. User searches for "Apple" → finds AAPL
2. User enters £100 to invest
3. Backend:
   - Converts £100 → $127 (current rate)
   - Gets AAPL price ($180)
   - Calculates qty: $127 / $180 = 0.706 shares
4. Places order with Alpaca (0.706 shares)
5. Alpaca fills order at $180.50
6. User gets 0.703 shares (slightly less due to price movement)
7. Portfolio shows:
   - AAPL: 0.703 shares
   - Value: £99.87
   - Cost: £100.00
   - P&L: -£0.13

---

## Revenue Projections (Subscription Model)

### Conservative (First Year)

| Month | Users | Subscribers (30%) | Revenue | Costs | Profit |
|-------|-------|-------------------|---------|-------|--------|
| 1 | 50 | 15 | £75 | £114 | -£39 |
| 3 | 200 | 60 | £300 | £114 | +£186 |
| 6 | 500 | 150 | £750 | £114 | +£636 |
| 12 | 2,000 | 600 | £3,000 | £114 | +£2,886 |

**Break-even**: Month 2-3 (23 subscribers @ £4.99/month)

### Optimistic (With Growth)

| Month | Users | Subscribers | Revenue | Profit |
|-------|-------|-------------|---------|--------|
| 6 | 1,000 | 400 | £2,000 | £1,886 |
| 12 | 5,000 | 2,000 | £10,000 | £9,886 |
| 18 | 10,000 | 4,000 | £20,000 | £19,886 |
| 24 | 20,000 | 8,000 | £40,000 | £39,886 |

**With 20k users = £40k/month revenue = £480k/year** 🚀

---

## Next Steps

### Option A: Pure Alpaca (Stocks + Crypto)
Replace Binance with Alpaca completely
- ✅ Simpler (one provider)
- ✅ Stocks + crypto in one place
- ❌ Higher fees on crypto (0.5% vs 0.1%)

### Option B: Hybrid (Alpaca + Binance)
Use Alpaca for stocks, keep Binance for crypto
- ✅ Best crypto fees (0.1%)
- ✅ Stock trading via Alpaca
- ❌ More complex (two integrations)

### Option C: Start with Alpaca, Add Binance Later
Launch with stocks first, add crypto later
- ✅ Easier regulatory (stocks only initially)
- ✅ Lower complexity
- ✅ Add crypto when you have traction

**My Recommendation**: Option C (Start with Alpaca stocks, add crypto in Month 3)

---

## Legal Considerations (UK)

### What You Need
1. **FCA Registration**: Not required for stock brokerage if you're using Alpaca (they're regulated)
2. **Company**: UK Limited Company (you have this)
3. **Terms**: Update to mention stock trading
4. **Risk Warnings**: Add stock-specific risks

### What Alpaca Handles
- ✅ Order execution
- ✅ US regulatory compliance (SEC, FINRA)
- ✅ Market connectivity
- ✅ Clearing & settlement

### What You Handle
- ✅ UK customer relationships
- ✅ Customer support
- ✅ Marketing
- ✅ UK tax reporting (future)

---

## Updated Launch Plan

### Week 1: Setup
- [ ] Apply for Alpaca Broker API
- [ ] Update backend for stock trading
- [ ] Add stock search to frontend

### Week 2: Testing
- [ ] Test paper trading (sandbox)
- [ ] Test fractional orders
- [ ] Test portfolio tracking

### Week 3: Launch Prep
- [ ] Switch to production API
- [ ] Update legal docs
- [ ] Create marketing materials

### Week 4: Soft Launch
- [ ] Invite 20 beta users
- [ ] Offer free Premium for 3 months
- [ ] Collect feedback

### Month 2: Public Launch
- [ ] Post on Reddit r/UKPersonalFinance
- [ ] Target "Freetrade alternative" keyword
- [ ] Launch referral program

---

## Want Me To Build This?

I can help you:

1. **Create Alpaca integration** (backend/services/alpaca.js)
2. **Update order routes** for stock trading
3. **Add portfolio tracking** (show holdings)
4. **Build stock search** in frontend
5. **Add watchlists** feature
6. **Update deployment guide** for Alpaca

Just say "**yes, build Alpaca integration**" and I'll start! 🚀

---

## Questions?

**Q: Can I offer UK stocks too?**
A: Not with Alpaca (US only). But you can add them later via Interactive Brokers or another provider.

**Q: How do I handle ISAs?**
A: Start without ISA, add later when you have 1,000+ users. Requires more regulatory work.

**Q: What about crypto?**
A: Alpaca has crypto too (0.5% fee). Or keep Binance for crypto (0.1% fee).

**Q: Is this legal in UK?**
A: Yes! You're just a customer-facing layer. Alpaca handles all regulated activities.

**Ready to pivot to stocks? This could be huge!** 📈

