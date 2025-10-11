# 🔍 Infrastructure Audit - Current vs. Broker Model

## Current Infrastructure (Over-engineered for £1k budget)

### Backend Services (7 microservices)
1. ✅ **api-gateway** - KEEP (simplify)
2. ❌ **compliance-service** - REMOVE (manual KYC initially)
3. ✅ **ledger-service** - KEEP (essential)
4. ❌ **market-data-service** - REMOVE (use Binance API)
5. ❌ **order-gateway** - REMOVE (broker model doesn't need matching)
6. ❌ **settlement-service** - REMOVE (Binance handles settlement)
7. ✅ **shared** - KEEP (common utilities)

### Infrastructure Dependencies
1. ✅ **PostgreSQL** - KEEP (essential for ledger)
2. ❌ **Redis** - REMOVE for now (add later)
3. ❌ **Kafka** - REMOVE (unnecessary for broker model)
4. ❌ **Zookeeper** - REMOVE (only needed for Kafka)
5. ❌ **TimescaleDB** - REMOVE (Binance provides market data)
6. ❌ **Prometheus** - REMOVE (Railway provides monitoring)
7. ❌ **Grafana** - REMOVE (use Railway dashboard)
8. ❌ **Jaeger** - REMOVE (overkill for MVP)

### Cost Analysis

**Current Monthly Cost (AWS EKS)**:
- EKS cluster: £60/month
- EC2 nodes (2x t3.medium): £50/month
- RDS PostgreSQL: £25/month
- Load Balancer: £15/month
- ECR storage: £5/month
- Data transfer: £10/month
- **TOTAL: ~£165/month** ❌ (16.5% of budget)

**Proposed Monthly Cost (Railway)**:
- Hobby plan: £15/month (includes Postgres, Redis, hosting)
- **TOTAL: £15/month** ✅ (1.5% of budget)

**Savings: £150/month (90% reduction!)** 🎉

---

## Simplified Broker Model Architecture

### Single Backend Service (Monolith)
```
bitcurrent-backend/
├── server.js              # Main entry point
├── config/
│   └── database.js        # Postgres connection
├── routes/
│   ├── auth.js            # Login, register, logout
│   ├── orders.js          # Place orders (market only)
│   ├── balances.js        # Get user balances
│   ├── deposits.js        # Deposit requests
│   ├── withdrawals.js     # Withdrawal requests
│   └── admin.js           # Admin panel
├── services/
│   ├── binance.js         # Binance API wrapper
│   ├── ledger.js          # Balance tracking
│   ├── kyc.js             # Basic KYC flow
│   └── notifications.js   # Email alerts
├── middleware/
│   ├── auth.js            # JWT verification
│   └── ratelimit.js       # Basic rate limiting
└── database/
    └── schema.sql         # Simplified schema
```

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js (simple, proven)
- **Database**: PostgreSQL (Railway managed)
- **Auth**: JWT + bcrypt
- **API Client**: axios (for Binance)
- **Email**: nodemailer + SendGrid
- **Deployment**: Railway.app

### Features for MVP
✅ User registration (email + password)
✅ Basic KYC (name, DOB, address - manual review)
✅ GBP deposits (manual bank transfer)
✅ Market orders (BUY/SELL via Binance)
✅ Balance tracking (GBP, BTC, ETH)
✅ Withdrawal requests (manual approval)
✅ Admin panel (approve deposits/withdrawals)
✅ Transaction history
✅ Email notifications

❌ Limit orders (add later)
❌ Advanced charts (use TradingView widgets)
❌ Automated KYC (manual first 100 users)
❌ Real-time WebSocket (polling is fine)
❌ Staking (add after profitable)

---

## Migration Plan

### Phase 1: Create Simplified Backend ✅
- Build Node.js monolith
- Implement 5 core tables
- Add Binance integration
- Create admin panel

### Phase 2: Deploy to Railway ✅
- Sign up for Railway
- Connect GitHub repo
- Deploy backend
- Configure environment variables

### Phase 3: Update Frontend ✅
- Point API calls to Railway URL
- Remove unused features
- Deploy to Vercel

### Phase 4: Test & Launch ✅
- Test deposit flow
- Test trading
- Test withdrawals
- Invite 10 beta users

---

## Files to Keep/Remove

### Keep (Frontend)
✅ /frontend/* (already built and optimized)

### Keep (Backend - Will Rebuild)
✅ /services/api-gateway/internal/handlers/auth.go (convert to Node.js)
✅ /services/ledger-service/internal/handlers/* (convert to Node.js)
✅ /migrations/postgresql/* (simplify schema)

### Remove (Not needed for broker model)
❌ /services/order-gateway/* (no matching engine needed)
❌ /services/market-data-service/* (use Binance API)
❌ /services/settlement-service/* (Binance handles settlement)
❌ /services/compliance-service/* (manual KYC)
❌ /matching-engine/* (broker model doesn't match orders)
❌ /infrastructure/* (Railway handles infrastructure)
❌ /docker-compose.yml (Railway handles orchestration)

---

## Audit Complete ✅

**Next Steps**:
1. Create simplified Node.js backend
2. Implement 5 essential database tables
3. Build Binance integration
4. Create admin panel
5. Deploy to Railway

**Estimated Time**: 4-6 hours of focused work
**Result**: Production-ready broker exchange for £15/month

