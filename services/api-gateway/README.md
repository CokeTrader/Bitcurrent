// BitCurrent API Gateway

Main entry point for all client requests to BitCurrent Exchange.

## Features

- RESTful API for trading operations
- WebSocket for real-time market data
- JWT authentication
- Rate limiting (100 req/min)
- Request logging and monitoring
- Health checks and metrics

## Endpoints

### Public Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `GET /api/v1/markets` - List trading pairs
- `GET /api/v1/orderbook/{symbol}` - Get orderbook snapshot
- `GET /api/v1/ticker/{symbol}` - Get 24h ticker data

### Protected Endpoints (require JWT)

**Orders:**
- `POST /api/v1/orders` - Place new order
- `GET /api/v1/orders` - List user orders
- `GET /api/v1/orders/{id}` - Get order details
- `DELETE /api/v1/orders/{id}` - Cancel order

**Account:**
- `GET /api/v1/accounts/{id}/balances` - Get account balances
- `GET /api/v1/accounts/{id}/transactions` - List transactions
- `POST /api/v1/deposits` - Initiate deposit
- `POST /api/v1/withdrawals` - Request withdrawal
- `GET /api/v1/withdrawals/{id}` - Get withdrawal status

**User:**
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update user profile

### System Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `WS /ws` - WebSocket connection

## Building

```bash
go build -o bin/api-gateway ./cmd
```

## Running

```bash
# With environment variables
export DATABASE_URL=postgres://...
export REDIS_URL=redis://...
export JWT_SECRET=your-secret-key

./bin/api-gateway
```

## Docker

```bash
# Build image
docker build -t bitcurrent/api-gateway:latest .

# Run container
docker run -p 8080:8080 -p 9091:9091 \
  -e DATABASE_URL=postgres://... \
  -e REDIS_URL=redis://... \
  bitcurrent/api-gateway:latest
```

## Configuration

See `.env.sample` in project root for all configuration options.

## Testing

```bash
# Unit tests
go test ./...

# Integration tests
go test -tags=integration ./...

# With coverage
go test -cover ./...
```

## Middleware

- **Authentication**: JWT validation on protected routes
- **Rate Limiting**: 100 requests/minute per user or IP
- **Logging**: Structured JSON logging of all requests
- **Recovery**: Panic recovery with stack traces
- **CORS**: Cross-origin resource sharing support

## WebSocket Protocol

### Subscribe to channels

```json
{
  "type": "subscribe",
  "channels": ["trades", "orderbook"],
  "symbols": ["BTC-GBP", "ETH-GBP"]
}
```

### Unsubscribe

```json
{
  "type": "unsubscribe",
  "channels": ["trades"],
  "symbols": ["BTC-GBP"]
}
```

### Keep-alive

Server sends ping every 54 seconds. Client should respond with pong.

## Metrics

Exposed on `/metrics` endpoint:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `http_requests_in_flight` - Concurrent requests
- `database_connections` - Database pool stats
- `redis_connections` - Redis pool stats

## Dependencies

- Gorilla Mux - HTTP routing
- Gorilla WebSocket - WebSocket support
- pgx/v5 - PostgreSQL driver
- go-redis/v9 - Redis client
- zap - Structured logging
- jwt/v5 - JWT authentication
- bcrypt - Password hashing



