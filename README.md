# 🚀 BitCurrent - Modern Crypto Exchange

**Trade Bitcoin for 0.25% fees | UK-based crypto broker**

BitCurrent is a next-generation cryptocurrency exchange built for the UK market, offering institutional-grade trading at retail fees.

---

## ✨ Features

### 💰 Trading
- **0.25% trading fees** (6x cheaper than Coinbase)
- Market & limit orders
- Stop-loss & take-profit
- Advanced order types
- Real-time price feeds
- TradingView charts

### 💳 Deposits & Withdrawals
- Instant Stripe deposits (card/bank)
- Fast GBP withdrawals
- No deposit fees
- £10 signup bonus

### 🔒 Security
- Bank-grade encryption
- 2FA authentication
- Cold storage (95%+ of funds)
- UK-based & compliant
- Insurance protection

### 📊 Advanced Features
- Portfolio analytics
- Staking programs (up to 8% APY)
- Referral program (20% commission)
- API for trading bots
- Mobile-responsive

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js 14 + React 18
│   (Vercel)      │  TypeScript + Tailwind
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  Node.js + Express
│   (Railway)     │  PostgreSQL
└────────┬────────┘
         │
         ├──────────► Alpaca API (Trading)
         ├──────────► Stripe (Payments)
         └──────────► Email Service
```

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Framer Motion
- TradingView widgets
- Recharts for analytics

**Backend:**
- Node.js 18 + Express
- PostgreSQL (primary database)
- JWT authentication
- WebSocket (real-time prices)
- Winston (logging)

**Infrastructure:**
- Vercel (frontend hosting)
- Railway (backend + database)
- GitHub Actions (CI/CD)
- Dependabot (security)

**Integrations:**
- Alpaca API (crypto trading)
- Stripe (payments)
- Transactional email service

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone Repository

```bash
git clone https://github.com/CokeTrader/Bitcurrent.git
cd bitcurrent1
```

### 2. Setup Backend

```bash
cd backend-broker

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - ALPACA_KEY_ID
# - ALPACA_SECRET_KEY
# - STRIPE_SECRET_KEY

# Run database migrations
node scripts/migration-manager.js up

# Start backend
npm run dev
```

Backend runs on `http://localhost:4000`

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local
# Required:
# - NEXT_PUBLIC_API_URL=http://localhost:4000
# - NEXT_PUBLIC_STRIPE_KEY=pk_test_...

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Access Application

- **Homepage:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Trading:** http://localhost:3000/trade/BTCUSD
- **API Docs:** http://localhost:3000/api-docs

---

## 📦 Project Structure

```
bitcurrent1/
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   ├── hooks/            # Custom React hooks
│   └── tests/            # E2E tests (Playwright)
│
├── backend-broker/       # Express API server
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── database/         # DB queries
│   ├── migrations/       # SQL migrations
│   ├── utils/            # Helpers
│   ├── scripts/          # Utility scripts
│   └── templates/        # Email templates
│
├── docs/                 # Documentation
│   ├── API.md           # API documentation
│   ├── DEPLOYMENT.md    # Deployment guide
│   └── ARCHITECTURE.md  # Architecture docs
│
└── .github/             # GitHub Actions
    └── workflows/       # CI/CD pipelines
```

---

## 🧪 Testing

### Backend Unit Tests

```bash
cd backend-broker
npm test
```

### Frontend E2E Tests

```bash
cd frontend
npx playwright test
```

### API Testing

```bash
# Test Stripe integration
node backend-broker/scripts/test-stripe.js

# Test Alpaca integration
node backend-broker/scripts/test-alpaca.js
```

---

## 🚢 Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

**Environment Variables:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_KEY`
- `NEXT_PUBLIC_GA_ID`

### Backend (Railway)

1. Create new project in Railway
2. Connect GitHub repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically on push to `main`

**Environment Variables:**
- `DATABASE_URL` (auto-provided by Railway)
- `JWT_SECRET`
- `ALPACA_KEY_ID`
- `ALPACA_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `NODE_ENV=production`

### Database Migrations

```bash
# SSH into Railway
railway run bash

# Run migrations
node scripts/migration-manager.js up
```

---

## 🔐 Security

- **Automated scanning:** TruffleHog (secrets), Snyk (vulnerabilities)
- **Dependency updates:** Dependabot (weekly)
- **Authentication:** JWT + 2FA
- **Data encryption:** AES-256 at rest, TLS 1.3 in transit
- **Rate limiting:** Per-endpoint limits
- **CSRF protection:** Token-based
- **Input sanitization:** DOMPurify + validators
- **SQL injection prevention:** Parameterized queries only

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for full report.

---

## 📖 API Documentation

Full API documentation: [docs/API.md](docs/API.md)

**Quick Examples:**

```bash
# Get market data
curl https://api.bitcurrent.com/v1/markets

# Get account balance
curl -H "Authorization: Bearer <token>" \
  https://api.bitcurrent.com/v1/account/balance

# Place order
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -d '{"pair":"BTC/USD","side":"buy","amount":0.001}' \
  https://api.bitcurrent.com/v1/orders
```

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📜 License

Proprietary - All rights reserved

---

## 🆘 Support

- **Email:** support@bitcurrent.com
- **Discord:** https://discord.gg/bitcurrent
- **Docs:** https://docs.bitcurrent.com
- **Status:** https://status.bitcurrent.com

---

## 📊 Project Status

![Build Status](https://github.com/CokeTrader/Bitcurrent/workflows/CI/badge.svg)
![Security Score](https://img.shields.io/badge/security-82%2F100-green)
![Test Coverage](https://img.shields.io/badge/coverage-75%25-yellow)

**Current Version:** 1.0.0-beta  
**Status:** Pre-launch (testing phase)  
**Target Launch:** Q4 2025

---

## 🎯 Roadmap

### Q4 2025
- [x] Core trading features
- [x] Stripe deposits
- [x] Portfolio analytics
- [ ] iOS/Android apps
- [ ] Institutional accounts

### Q1 2026
- [ ] Margin trading
- [ ] Futures contracts
- [ ] Advanced charting
- [ ] Copy trading

### Q2 2026
- [ ] NFT marketplace
- [ ] DeFi integration
- [ ] Lending/borrowing

---

**Built with ❤️ in the UK**

*Trade smarter, not harder.* 🚀
