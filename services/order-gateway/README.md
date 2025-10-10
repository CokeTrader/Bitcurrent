# BitCurrent Order Gateway

Pre-trade risk management and order validation service.

## Features

- Pre-trade risk checks before order submission
- Balance verification (sufficient funds)
- Position limit enforcement
- Daily volume limit tracking
- Fat finger protection (price deviation check)
- Account status validation
- Order size validation (min/max limits)
- Integration with matching engine via gRPC

## Endpoints

### Internal API

- `POST /internal/v1/orders/validate` - Validate order (risk checks only)
- `POST /internal/v1/orders/submit` - Submit order to matching engine

## Risk Checks

### 1. Account Status
- Verify account is active (not frozen/closed)

### 2. Order Size Limits
- Check against trading pair min/max size

### 3. Balance Check
- For buy orders: verify sufficient quote currency
- Calculate required: price × quantity + estimated fees
- Check against available balance (not reserved)

### 4. Position Limits
- Query current open position
- Calculate new position after order
- Verify within allowed limits

### 5. Daily Volume Limits
- Sum today's trading volume for account
- Check against KYC tier limits:
  - Tier 0: £1,000/day
  - Tier 1: £5,000/day
  - Tier 2: £50,000/day
  - Tier 3: £500,000/day

### 6. Fat Finger Protection
- Get current mid price from orderbook
- Calculate price deviation
- Reject if deviation > 10%

## Architecture

```
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │ HTTP
┌──────▼──────────┐
│ Order Gateway   │
│ (Risk Checks)   │
└──────┬──────────┘
       │ gRPC
┌──────▼──────────┐
│ Matching Engine │
│   (Rust)        │
└─────────────────┘
```

## Building

```bash
go build -o bin/order-gateway ./cmd
```

## Docker

```bash
docker build -t bitcurrent/order-gateway:latest .
docker run -p 8081:8081 bitcurrent/order-gateway:latest
```

## Configuration

Port: 8081 (default)
Metrics: 9091

See `.env.sample` for all configuration options.



