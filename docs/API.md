# 📘 BitCurrent API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.bitcurrent.com/v1`  
**Authentication:** JWT Bearer tokens or API keys

---

## 🔐 Authentication

### Method 1: JWT (Web/Mobile)

```bash
# Login to get JWT token
POST /auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

# Use in subsequent requests
Authorization: Bearer <token>
```

### Method 2: API Key (Trading Bots)

```bash
# Create API key in dashboard
# Use in requests
X-API-Key: your-api-key-here
X-API-Secret: your-api-secret-here
```

---

## 📊 Market Data

### GET /markets

Get list of all trading pairs with 24h statistics.

**Authentication:** Not required

```bash
curl https://api.bitcurrent.com/v1/markets
```

**Response:**
```json
{
  "success": true,
  "markets": [
    {
      "pair": "BTC/USD",
      "lastPrice": 67234.50,
      "change24h": 2.5,
      "volume24h": 1234567.89,
      "high24h": 68000,
      "low24h": 66000
    }
  ]
}
```

### GET /markets/:pair/ticker

Get current price for a trading pair.

```bash
curl https://api.bitcurrent.com/v1/markets/BTCUSD/ticker
```

### GET /markets/:pair/orderbook

Get order book depth.

**Query Parameters:**
- `depth` (optional): Number of levels (default: 20, max: 100)

```bash
curl https://api.bitcurrent.com/v1/markets/BTCUSD/orderbook?depth=50
```

**Response:**
```json
{
  "bids": [
    ["67200.00", "0.5"],
    ["67150.00", "1.2"]
  ],
  "asks": [
    ["67250.00", "0.8"],
    ["67300.00", "1.5"]
  ]
}
```

### GET /markets/:pair/trades

Get recent trades.

**Query Parameters:**
- `limit` (optional): Number of trades (default: 50, max: 500)

---

## 💰 Account Management

### GET /account/balance

Get account balances.

**Authentication:** Required

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.bitcurrent.com/v1/account/balance
```

**Response:**
```json
{
  "success": true,
  "balances": [
    {
      "currency": "USD",
      "total": 10000.00,
      "available": 9500.00,
      "locked": 500.00
    },
    {
      "currency": "BTC",
      "total": 0.5,
      "available": 0.4,
      "locked": 0.1
    }
  ]
}
```

### GET /account/portfolio

Get portfolio analytics and statistics.

### GET /account/activity

Get account activity history.

---

## 📈 Trading

### POST /orders

Place a new order.

**Authentication:** Required  
**Rate Limit:** 100 requests/minute

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pair": "BTC/USD",
    "side": "buy",
    "type": "limit",
    "amount": 0.001,
    "price": 67000
  }' \
  https://api.bitcurrent.com/v1/orders
```

**Request Body:**
- `pair` (string, required): Trading pair (e.g., "BTC/USD")
- `side` (string, required): "buy" or "sell"
- `type` (string, required): "market" or "limit"
- `amount` (number, required): Order amount (in base currency)
- `price` (number, required for limit): Limit price

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "ord_123456",
    "pair": "BTC/USD",
    "side": "buy",
    "type": "limit",
    "amount": 0.001,
    "price": 67000,
    "status": "open",
    "createdAt": "2025-10-13T00:00:00Z"
  }
}
```

### GET /orders

Get order history.

**Query Parameters:**
- `status` (optional): "open", "filled", "cancelled"
- `pair` (optional): Filter by trading pair
- `limit` (optional): Number of orders (default: 50, max: 500)
- `offset` (optional): Pagination offset

### GET /orders/:orderId

Get specific order details.

### DELETE /orders/:orderId

Cancel an open order.

### POST /orders/:orderId/amend

Modify an existing order (price/amount).

---

## 💳 Deposits & Withdrawals

### POST /deposits/stripe-checkout

Create Stripe checkout session for deposits.

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD"}' \
  https://api.bitcurrent.com/v1/deposits/stripe-checkout
```

### POST /withdrawals

Initiate a withdrawal.

**Authentication:** Required + 2FA

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "X-2FA-Token: 123456" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "amount": 100,
    "method": "bank_transfer",
    "destination": "..."
  }' \
  https://api.bitcurrent.com/v1/withdrawals
```

### GET /deposits

Get deposit history.

### GET /withdrawals

Get withdrawal history.

---

## 🔒 Security

### POST /security/2fa/enable

Enable two-factor authentication.

### POST /security/2fa/verify

Verify 2FA setup.

### GET /security/sessions

Get active sessions.

### DELETE /security/sessions/:sessionId

Revoke a session.

### GET /security/activity

Get security activity log.

---

## 🎁 Referrals

### GET /referrals/code

Get your referral code.

### POST /referrals/apply

Apply a referral code.

### GET /referrals/stats

Get referral statistics (earnings, referrals count).

---

## 📦 API Keys (for Trading Bots)

### POST /api-keys

Create a new API key.

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Trading Bot",
    "permissions": ["read", "trade"]
  }' \
  https://api.bitcurrent.com/v1/api-keys
```

**Response:**
```json
{
  "success": true,
  "apiKey": {
    "key": "api_abc123...",
    "secret": "sec_xyz789...",
    "name": "My Trading Bot",
    "permissions": ["read", "trade"],
    "createdAt": "2025-10-13T00:00:00Z"
  },
  "warning": "Save your secret now - it won't be shown again!"
}
```

### GET /api-keys

List all API keys.

### DELETE /api-keys/:keyId

Revoke an API key.

---

## 🎯 Staking

### GET /staking/pools

Get available staking pools.

### POST /staking/stake

Stake cryptocurrency.

### POST /staking/unstake

Unstake cryptocurrency.

### GET /staking/positions

Get your staking positions.

---

## 📋 KYC

### POST /kyc/submit

Submit KYC documents.

### GET /kyc/status

Get KYC verification status.

---

## ⚠️ Error Handling

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { }
}
```

**Common Error Codes:**
- `INVALID_TOKEN`: Authentication failed
- `INSUFFICIENT_BALANCE`: Not enough funds
- `INVALID_PAIR`: Trading pair not supported
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `ORDER_NOT_FOUND`: Order doesn't exist
- `2FA_REQUIRED`: Two-factor authentication needed

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid auth)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `429`: Too many requests (rate limited)
- `500`: Internal server error

---

## 🔄 WebSocket API

Connect to real-time data streams.

**Endpoint:** `wss://api.bitcurrent.com/v1/ws`

### Subscribe to Price Updates

```javascript
const ws = new WebSocket('wss://api.bitcurrent.com/v1/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    channel: 'ticker',
    pair: 'BTC/USD'
  }));
});

ws.on('message', (data) => {
  const update = JSON.parse(data);
  console.log('Price:', update.price);
});
```

### Available Channels:
- `ticker` - Price updates
- `trades` - Recent trades
- `orderbook` - Order book updates
- `orders` - Your order updates (auth required)

---

## 📊 Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Market Data | 600/minute |
| Account Info | 300/minute |
| Trading | 100/minute |
| Deposits/Withdrawals | 10/minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633046400
```

---

## 🧪 Testing

### Testnet

Use our testnet for development:

**Base URL:** `https://testnet-api.bitcurrent.com/v1`

All features work identically to production.

### Sandbox Accounts

Create test accounts with fake balance for testing.

---

## 📚 SDKs

### Official SDKs

- **Python:** `pip install bitcurrent-python`
- **JavaScript:** `npm install bitcurrent-js`
- **Go:** `go get github.com/bitcurrent/go-sdk`

### Community SDKs

- Ruby, PHP, Java (see GitHub)

---

## 🆘 Support

- **Documentation:** https://docs.bitcurrent.com
- **API Status:** https://status.bitcurrent.com
- **Support:** support@bitcurrent.com
- **Discord:** https://discord.gg/bitcurrent

---

## 📝 Changelog

### v1.0.0 (October 2025)
- Initial API release
- Trading endpoints
- Market data
- WebSocket support

---

**Happy Trading! 🚀**

