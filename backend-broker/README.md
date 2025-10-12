# BitCurrent Backend API

**UK Crypto Broker** - Production-ready trading platform backend

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables (see .env.example)
cp .env.example .env

# Run development server
npm run dev

# Run production server
npm start
```

## 📋 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Alpaca API (Trading)
ALPACA_KEY_ID=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # or live

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_...  # Required for deposits
STRIPE_WEBHOOK_SECRET=whsec_...  # Required for webhooks

# JWT
JWT_SECRET=your_secure_random_string

# Frontend URL
FRONTEND_URL=https://bitcurrent.vercel.app

# Email (Optional)
RESEND_API_KEY=re_...  # For transactional emails

# Environment
NODE_ENV=production
PORT=3001
```

## 🏗️ Architecture

```
backend-broker/
├── routes/          # API endpoints
│   ├── auth.js      # Registration, login
│   ├── orders.js    # Trading orders
│   ├── deposits.js  # Deposit management
│   ├── stripe-webhooks.js  # Payment webhooks
│   └── health.js    # Health checks
├── services/        # Business logic
│   ├── alpaca.js    # Alpaca trading API
│   └── stripe-service.js  # Stripe integration
├── middleware/      # Express middleware
│   ├── auth.js      # JWT authentication
│   ├── cache.js     # Response caching
│   ├── error-handler.js  # Error handling
│   ├── rate-limiter.js   # Rate limiting
│   └── security.js  # Security headers
├── utils/           # Utilities
│   ├── logger.js    # Winston logging
│   └── email-service.js  # Email sending
├── templates/       # Email templates
│   └── emails/
│       ├── welcome.html
│       └── deposit-confirmed.html
└── server.js        # Express app
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/verify-email` - Verify email

### Trading
- `GET /api/v1/markets` - Get all markets
- `GET /api/v1/markets/:symbol/quote` - Get real-time quote
- `POST /api/v1/orders` - Place order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details

### Deposits & Withdrawals
- `POST /api/v1/deposits/stripe-checkout` - Create Stripe checkout
- `GET /api/v1/deposits` - Get deposit history
- `POST /api/v1/withdrawals` - Request withdrawal

### Account
- `GET /api/v1/balance` - Get account balance
- `GET /api/v1/portfolio` - Get portfolio
- `PUT /api/v1/profile` - Update profile

### Webhooks
- `POST /api/v1/stripe-webhooks` - Stripe payment webhooks

### Monitoring
- `GET /health` - Basic health check
- `GET /health/status` - Detailed system status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse (100 req/15min general, 5 req/15min auth)
- **Helmet**: Security headers (CSP, XSS protection)
- **CORS**: Configured for production domains
- **JWT Auth**: Secure token-based authentication
- **Input Sanitization**: XSS prevention
- **Caching**: Reduces load on external APIs

## 🏃 Performance

- **Response Caching**: 
  - Prices: 5 seconds
  - Market data: 1 minute
  - User data: 5 minutes
- **Connection Pooling**: PostgreSQL connection management
- **Error Recovery**: Alpaca API fallback methods

## 📊 Monitoring

Health checks available at:
- `/health` - Simple uptime check
- `/health/status` - System metrics, cache stats, service status

Logging:
- **Winston** structured logging
- Console output in development
- JSON format in production

## 🧪 Testing

```bash
# Test Stripe integration
node scripts/test-stripe.js

# Test database connection
npm run test:db

# Check API health
curl http://localhost:3001/health
```

## 🚀 Deployment

### Railway (Recommended)

1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push

### Manual Deployment

```bash
# Build (if needed)
npm run build

# Start production server
NODE_ENV=production npm start
```

## 📝 API Rate Limits

- **General API**: 100 requests / 15 minutes
- **Authentication**: 5 attempts / 15 minutes
- **Trading**: 30 orders / minute
- **Financial**: 10 transactions / hour

## 🆘 Troubleshooting

### Alpaca Orders Failing
- Check API keys are set correctly
- Verify symbol format (BTC/USD not BTCGBP)
- Check Alpaca account has paper trading enabled
- Review logs for specific error messages

### Stripe Webhooks Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check webhook endpoint URL matches Railway domain
- Test webhook with Stripe CLI: `stripe listen`

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database is accessible from Railway
- Review connection pool settings

## 📚 Documentation

- [Alpaca API Docs](https://alpaca.markets/docs/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Railway Docs](https://docs.railway.app/)

## 🤝 Support

Email: support@bitcurrent.co.uk

## 📄 License

Proprietary - BitCurrent Ltd.
