# BitCurrent Exchange - API Documentation

**Version**: 1.0  
**Base URL**: `https://api.bitcurrent.co.uk/api/v1`  
**WebSocket**: `wss://ws.bitcurrent.co.uk/ws`

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Token via Login

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "kyc_level": 2,
    "status": "active"
  }
}
```

---

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**: 201 Created
```json
{
  "token": "...",
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "kyc_level": 0,
    "status": "active"
  }
}
```

#### POST /auth/refresh
Refresh an expired JWT token.

**Request**:
```json
{
  "refresh_token": "..."
}
```

**Response**:
```json
{
  "token": "NEW_JWT_TOKEN"
}
```

---

### Markets

#### GET /markets
List all available trading pairs.

**Authentication**: Not required

**Response**:
```json
{
  "markets": [
    {
      "symbol": "BTC-GBP",
      "base_currency": "BTC",
      "quote_currency": "GBP",
      "min_order_size": "0.0001",
      "max_order_size": "100",
      "price_precision": 2,
      "quantity_precision": 8,
      "maker_fee_bps": 10,
      "taker_fee_bps": 15,
      "status": "active"
    }
  ]
}
```

#### GET /orderbook/{symbol}
Get current orderbook for a trading pair.

**Parameters**:
- `symbol` (path): Trading pair (e.g., BTC-GBP)
- `depth` (query): Number of levels (default: 20, max: 100)

**Example**: `GET /orderbook/BTC-GBP?depth=10`

**Response**:
```json
{
  "symbol": "BTC-GBP",
  "bids": [
    ["45000.00", "1.5"],
    ["44950.00", "2.1"]
  ],
  "asks": [
    ["45050.00", "0.8"],
    ["45100.00", "1.2"]
  ],
  "timestamp": "2025-10-10T14:30:00Z"
}
```

#### GET /ticker/{symbol}
Get 24-hour ticker data.

**Response**:
```json
{
  "symbol": "BTC-GBP",
  "last_price": "45025.00",
  "volume_24h": "125.5",
  "high_24h": "46000.00",
  "low_24h": "44500.00",
  "price_change_24h": "+525.00",
  "price_change_percent_24h": "+1.18",
  "trades_count_24h": 1523,
  "timestamp": "2025-10-10T14:30:00Z"
}
```

---

### Orders

#### POST /orders
Place a new order.

**Authentication**: Required  
**Rate Limit**: 100 requests/minute

**Request**:
```json
{
  "symbol": "BTC-GBP",
  "side": "buy",
  "order_type": "limit",
  "price": "45000.00",
  "quantity": "0.5",
  "time_in_force": "GTC",
  "post_only": false
}
```

**Parameters**:
- `symbol` (required): Trading pair
- `side` (required): "buy" or "sell"
- `order_type` (required): "market" or "limit"
- `price` (required for limit): Order price
- `quantity` (required): Order quantity
- `time_in_force` (optional): "GTC", "IOC", "FOK" (default: GTC)
- `post_only` (optional): Only add liquidity (default: false)

**Response**: 201 Created
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "symbol": "BTC-GBP",
  "side": "buy",
  "order_type": "limit",
  "price": "45000.00",
  "quantity": "0.5",
  "filled_quantity": "0",
  "status": "new",
  "created_at": "2025-10-10T14:30:00Z"
}
```

#### GET /orders
List your orders.

**Authentication**: Required

**Parameters**:
- `symbol` (optional): Filter by trading pair
- `status` (optional): Filter by status (new, partial, filled, cancelled)
- `limit` (optional): Number of results (default: 50, max: 1000)
- `page` (optional): Page number (default: 1)

**Response**:
```json
{
  "orders": [
    {
      "id": "...",
      "symbol": "BTC-GBP",
      "side": "buy",
      "order_type": "limit",
      "price": "45000.00",
      "quantity": "0.5",
      "filled_quantity": "0.25",
      "status": "partial",
      "created_at": "2025-10-10T14:00:00Z"
    }
  ],
  "page": 1,
  "limit": 50
}
```

#### DELETE /orders/{id}
Cancel an order.

**Authentication**: Required

**Response**:
```json
{
  "message": "Order cancelled successfully"
}
```

---

### Account

#### GET /accounts/{account_id}/balances
Get account balances.

**Authentication**: Required

**Response**:
```json
{
  "balances": [
    {
      "currency": "GBP",
      "balance": "10000.00",
      "available_balance": "9500.00",
      "reserved_balance": "500.00"
    },
    {
      "currency": "BTC",
      "balance": "2.50000000",
      "available_balance": "2.50000000",
      "reserved_balance": "0.00000000"
    }
  ]
}
```

#### GET /accounts/{account_id}/transactions
Get transaction history.

**Parameters**:
- `currency` (optional): Filter by currency
- `limit` (optional): Number of results
- `page` (optional): Page number

**Response**:
```json
{
  "transactions": [
    {
      "id": "...",
      "currency": "GBP",
      "amount": "1000.00",
      "balance_after": "10000.00",
      "entry_type": "deposit",
      "description": "GBP deposit via Faster Payments",
      "created_at": "2025-10-10T10:00:00Z"
    }
  ],
  "page": 1,
  "limit": 50
}
```

---

### Deposits

#### POST /deposits
Initiate a deposit.

**Request**:
```json
{
  "currency": "GBP",
  "amount": "1000.00"
}
```

**Response**: 201 Created
```json
{
  "deposit_id": "...",
  "reference": "BC-a1b2c3d4",
  "amount": "1000.00",
  "bank_details": {
    "account_name": "BitCurrent Exchange Ltd",
    "sort_code": "04-00-75",
    "account_number": "12345678",
    "bank_name": "ClearBank Limited"
  },
  "instructions": "Transfer £1000.00 using reference: BC-a1b2c3d4"
}
```

---

### Withdrawals

#### POST /withdrawals
Request a withdrawal.

**Request**:
```json
{
  "currency": "BTC",
  "amount": "0.5",
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
}
```

**Response**: 201 Created
```json
{
  "withdrawal_id": "...",
  "currency": "BTC",
  "amount": "0.5",
  "status": "pending",
  "message": "Withdrawal request received and pending approval"
}
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

**Error Response Format**:
```json
{
  "error": "Bad Request",
  "message": "Invalid order parameters",
  "code": 400
}
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public endpoints | 60 | 1 minute |
| Authenticated | 100 | 1 minute |
| Order placement | 10 | 1 second |
| WebSocket connections | 5 | Per user |

**Headers**:
- `X-RateLimit-Limit`: Requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## WebSocket API

**Connection**: `wss://ws.bitcurrent.co.uk/ws`

### Subscribe to Channels

**Send**:
```json
{
  "type": "subscribe",
  "channels": ["orderbook", "trades"],
  "symbols": ["BTC-GBP", "ETH-GBP"]
}
```

**Receive**:
```json
{
  "type": "subscribed",
  "data": {
    "channels": ["orderbook", "trades"],
    "symbols": ["BTC-GBP", "ETH-GBP"]
  }
}
```

### Orderbook Updates

```json
{
  "type": "orderbook_update",
  "symbol": "BTC-GBP",
  "changes": {
    "bids": [["45000.00", "1.5"]],
    "asks": [["45050.00", "0"]]
  },
  "timestamp": 1728565800
}
```

### Trade Updates

```json
{
  "type": "trade",
  "symbol": "BTC-GBP",
  "price": "45025.00",
  "quantity": "0.25",
  "side": "buy",
  "timestamp": 1728565800
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.bitcurrent.co.uk/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get markets
const markets = await client.get('/markets');

// Place order
const order = await client.post('/orders', {
  symbol: 'BTC-GBP',
  side: 'buy',
  order_type: 'limit',
  price: '45000.00',
  quantity: '0.5'
});
```

### Python

```python
import requests

BASE_URL = 'https://api.bitcurrent.co.uk/api/v1'
headers = {'Authorization': f'Bearer {token}'}

# Get balances
response = requests.get(
    f'{BASE_URL}/accounts/{account_id}/balances',
    headers=headers
)
balances = response.json()
```

### cURL

```bash
# Login
curl -X POST https://api.bitcurrent.co.uk/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Place order
curl -X POST https://api.bitcurrent.co.uk/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC-GBP",
    "side": "buy",
    "order_type": "limit",
    "price": "45000.00",
    "quantity": "0.5"
  }'
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-10 | Initial API documentation |

---

For full interactive API documentation, visit:  
**https://api.bitcurrent.co.uk/docs** (Swagger UI)



