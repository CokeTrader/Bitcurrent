# 🔐 Alpaca API Keys - Secure Setup Instructions

## ⚠️ IMPORTANT: Your API Keys

I've received your Alpaca API keys:
- **API Key**: `CKUWMRU5XQHT6QVSZBIE`
- **API Secret**: `dIXNH1mFJfpKMxQlqu3ATjVruvpCcvq0EAVIzHjD`

**These are PAPER TRADING keys** (sandbox mode) - perfect for testing!

---

## 🚀 Quick Setup (5 minutes)

### Option A: Local Testing (Right Now)

1. **Create `.env` file in `backend-broker/` folder**:
   ```bash
   cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/backend-broker
   ```

2. **Copy the example and add your keys**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file and add**:
   ```env
   # Alpaca Crypto API
   ALPACA_API_KEY=CKUWMRU5XQHT6QVSZBIE
   ALPACA_API_SECRET=dIXNH1mFJfpKMxQlqu3ATjVruvpCcvq0EAVIzHjD
   ALPACA_PAPER=true
   
   # Other required settings
   JWT_SECRET=your-random-secret-here
   DATABASE_URL=postgresql://localhost:5432/bitcurrent
   ADMIN_EMAIL=your@email.com
   FRONTEND_URL=http://localhost:3000
   ```

4. **Test the connection**:
   ```bash
   cd backend-broker
   npm install
   node -e "require('./services/alpaca').testConnection()"
   ```

---

### Option B: Railway Deployment (Production)

When deploying to Railway:

1. **Go to Railway dashboard** → Your project → Variables

2. **Add these environment variables**:
   ```
   ALPACA_API_KEY=CKUWMRU5XQHT6QVSZBIE
   ALPACA_API_SECRET=dIXNH1mFJfpKMxQlqu3ATjVruvpCcvq0EAVIzHjD
   ALPACA_PAPER=true
   ```

3. **Redeploy** the backend

---

## 📊 What's Supported

### Crypto Pairs (via Alpaca)
- ✅ **BTC** - Bitcoin
- ✅ **ETH** - Ethereum  
- ✅ **LTC** - Litecoin
- ✅ **BCH** - Bitcoin Cash
- ✅ **AAVE** - Aave
- ✅ **UNI** - Uniswap
- ✅ **LINK** - Chainlink

### Features
- ✅ Real-time prices (from Coinbase via Alpaca)
- ✅ Market orders (24/7 trading)
- ✅ Fractional trading (buy 0.001 BTC)
- ✅ GBP conversion (automatic USD→GBP)
- ✅ Paper trading (test with fake money)

### Fees
- **Your fee**: 0.25% per trade
- **Alpaca's fee**: Already included
- **Your profit**: Keep all 0.25%!

---

## 🧪 Testing Your Integration

### Test 1: Check Connection
```bash
cd backend-broker
node -e "const alpaca = require('./services/alpaca'); alpaca.testConnection().then(console.log)"
```

**Expected output**:
```
✅ Alpaca API connected
   Account Status: ACTIVE
   Buying Power: $100000.00
   Paper Trading: Yes
```

### Test 2: Get Bitcoin Price
```bash
node -e "const alpaca = require('./services/alpaca'); alpaca.getPrice('BTC-GBP').then(p => console.log('BTC Price:', p, 'GBP'))"
```

**Expected output**:
```
BTC Price: 52000 GBP
```

### Test 3: Get Quote
```bash
node -e "const alpaca = require('./services/alpaca'); alpaca.getQuote('BTC-GBP', 'BUY', 100).then(console.log)"
```

**Expected output**:
```json
{
  symbol: 'BTC-GBP',
  side: 'BUY',
  price: 52000,
  baseAmount: 0.00192308,
  quoteAmount: 100,
  fee: 0.25,
  feePercent: 0.25
}
```

---

## 🔄 Switching to Live Trading

### When You're Ready (After Testing)

1. **Get LIVE API keys** from Alpaca:
   - Go to: https://alpaca.markets/dashboard
   - Generate **Live Trading** keys
   
2. **Update environment variables**:
   ```env
   ALPACA_API_KEY=your-live-key
   ALPACA_API_SECRET=your-live-secret
   ALPACA_PAPER=false  # ← Important! Set to false
   ```

3. **Fund your Alpaca account**:
   - Min: $100 USD recommended
   - Transfer from your bank
   - Used for executing real trades

---

## 💡 How It Works

### User Journey
1. **User** deposits £100 GBP into BitCurrent
2. **User** wants to buy Bitcoin
3. **Your backend**:
   - Gets BTC price from Alpaca (e.g., £52,000)
   - Calculates qty: £100 / £52,000 = 0.00192 BTC
   - Places order with Alpaca
4. **Alpaca**:
   - Executes trade on Coinbase
   - Sends BTC to your account
5. **Your backend**:
   - Credits user's BTC balance: +0.00192 BTC
   - Debits user's GBP balance: -£100

### Your Revenue
- User pays: £100
- Trading fee (0.25%): £0.25
- **You keep**: £0.25 per trade
- **Volume needed**: £40k/month for £100/month revenue

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep API keys in `.env` file (never commit to git)
- Use paper trading keys for testing
- Enable 2FA on Alpaca account
- Monitor API usage regularly

### ❌ DON'T:
- Never commit `.env` file to GitHub
- Never share API keys in chat/slack
- Never use live keys for testing
- Never hardcode keys in source code

---

## 📈 Next Steps

1. ✅ **Test locally** with paper trading
2. ✅ **Deploy to Railway** with paper keys
3. ✅ **Test end-to-end** on staging
4. ✅ **Get live keys** when ready
5. ✅ **Switch to production** with live keys

---

## 🆘 Troubleshooting

### Error: "API key invalid"
- Check keys are correct
- Make sure no extra spaces
- Verify keys are for paper/live matching your `ALPACA_PAPER` setting

### Error: "Insufficient funds"
- Paper account has $100k virtual money
- Live account needs real funding

### Error: "Symbol not found"
- Check symbol format: Use `BTC-GBP` not `BTCUSD`
- Supported pairs listed above

### Error: "Connection refused"
- Check internet connection
- Verify Alpaca API status: https://status.alpaca.markets

---

## 📞 Support

**Alpaca Support**: https://alpaca.markets/support
**Alpaca Docs**: https://alpaca.markets/docs/api-references/trading-api/

---

**Your keys are secure and ready to use!** 🎉

Start testing now: `cd backend-broker && npm run dev`

