# BitCurrent Exchange

> **A modern cryptocurrency exchange platform built for the UK market**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)

**Live Site**: [https://bitcurrent.co.uk](https://bitcurrent.co.uk)

---

## 🚀 Quick Start

**Want to launch your own exchange in 2 weeks?**

👉 **Start here**: [START_HERE.md](👉_START_HERE.md)

---

## 📊 Overview

BitCurrent is a **broker model** cryptocurrency exchange that uses external liquidity providers (Binance) to offer trading without the complexity of a matching engine.

### Key Features

- ✅ **Trading**: Market orders for BTC, ETH, and more pairs
- ✅ **Multi-Currency**: GBP, BTC, ETH balance tracking
- ✅ **Admin Panel**: Manual approval for deposits/withdrawals
- ✅ **SEO Optimized**: Blog, FAQ, and content pages
- ✅ **Mobile Ready**: Responsive PWA design
- ✅ **Secure**: JWT auth, bcrypt, rate limiting

### Architecture

**Backend**: Node.js monolith with Binance API integration
**Frontend**: Next.js 14 with React 18
**Database**: PostgreSQL
**Hosting**: Railway (£15/month) + Vercel (free)

---

## 💰 Cost Breakdown

| Item | Cost | Details |
|------|------|---------|
| **Backend + Database** | £15/month | Railway.app |
| **Frontend** | £0/month | Vercel (free tier) |
| **Liquidity** | £0 upfront | Binance revenue-share |
| **Total** | **£15/month** | 90% cheaper than matching engine |

---

## 📁 Project Structure

```
Bitcurrent1/
├── backend-broker/              # Node.js broker model backend
│   ├── config/                  # Database configuration
│   ├── routes/                  # API endpoints
│   ├── services/                # Binance, Ledger services
│   ├── middleware/              # Auth, rate limiting
│   ├── database/                # PostgreSQL schema
│   └── server.js                # Main entry point
│
├── frontend/                    # Next.js frontend
│   ├── app/                     # Pages (App Router)
│   ├── components/              # React components
│   ├── lib/                     # Utils, API client
│   └── public/                  # Static assets
│
├── services/                    # [OLD] Go microservices (not used)
├── infrastructure/              # [OLD] K8s configs (not used)
│
└── docs/                        # Documentation
    ├── 👉_START_HERE.md         # Your action plan
    ├── 🎯_QUICK_START_GUIDE.md  # 2-hour launch guide
    ├── 🚀_RAILWAY_DEPLOYMENT_GUIDE.md
    ├── ✅_LAUNCH_CHECKLIST.md
    └── 📋_REALISTIC_BROKER_MODEL_PLAN.md
```

---

## 🎯 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Railway.app account (for deployment)
- Binance account (for liquidity)

### Local Development

```bash
# Backend
cd backend-broker
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🚢 Deployment

### Option 1: Quick Deploy (Railway + Vercel)

1. **Deploy Backend** (30 mins)
   ```bash
   # Sign up: https://railway.app
   # Connect GitHub repo
   # Deploy backend-broker folder
   # Add PostgreSQL database
   # Configure environment variables
   ```

2. **Deploy Frontend** (15 mins)
   ```bash
   # Sign up: https://vercel.com
   # Connect GitHub repo
   # Deploy frontend folder
   # Add environment variable: NEXT_PUBLIC_API_URL
   ```

3. **Follow the guides**:
   - [Quick Start Guide](🎯_QUICK_START_GUIDE.md) - Fastest path
   - [Railway Deployment](🚀_RAILWAY_DEPLOYMENT_GUIDE.md) - Detailed steps

### Option 2: Manual Docker Deploy

```bash
# Build backend
cd backend-broker
docker build -t bitcurrent-backend .
docker run -p 8080:8080 bitcurrent-backend

# Build frontend
cd frontend
docker build -t bitcurrent-frontend .
docker run -p 3000:3000 bitcurrent-frontend
```

---

## 📚 Documentation

### Essential Guides

| Document | Description | Time |
|----------|-------------|------|
| [👉 START HERE](👉_START_HERE.md) | Your action plan | 5 mins |
| [🎯 Quick Start](🎯_QUICK_START_GUIDE.md) | Launch in 2 weeks | 2 hours |
| [🚀 Railway Deploy](🚀_RAILWAY_DEPLOYMENT_GUIDE.md) | Step-by-step deployment | 4 hours |
| [✅ Launch Checklist](✅_LAUNCH_CHECKLIST.md) | Complete task list | Reference |
| [📋 Business Plan](📋_REALISTIC_BROKER_MODEL_PLAN.md) | Full strategy | 30 mins |

### Technical Docs

- [Backend README](backend-broker/README.md) - API documentation
- [Infrastructure Audit](🔍_INFRASTRUCTURE_AUDIT.md) - Cost analysis
- [Broker Model Architecture](docs/BROKER_MODEL_ARCHITECTURE.md) - System design

---

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Trading
- `GET /api/v1/orders/quote` - Get price quote
- `POST /api/v1/orders` - Place market order
- `GET /api/v1/orders` - Order history

### Balances
- `GET /api/v1/balances` - Get all balances
- `GET /api/v1/balances/:currency` - Get specific balance

### Deposits/Withdrawals
- `POST /api/v1/deposits` - Create deposit request
- `POST /api/v1/withdrawals` - Create withdrawal request
- `GET /api/v1/deposits` - Deposit history
- `GET /api/v1/withdrawals` - Withdrawal history

### Admin (requires admin auth)
- `GET /api/v1/admin/deposits/pending` - Pending deposits
- `POST /api/v1/admin/deposits/:id/approve` - Approve deposit
- `GET /api/v1/admin/withdrawals/pending` - Pending withdrawals
- `POST /api/v1/admin/withdrawals/:id/approve` - Approve withdrawal

---

## 🎨 Tech Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Auth**: JWT + bcrypt
- **API**: Binance REST API

### Frontend
- **Framework**: Next.js 14
- **UI**: React 18 + TailwindCSS
- **State**: Zustand
- **Web3**: wagmi + RainbowKit
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Backend Hosting**: Railway.app
- **Frontend Hosting**: Vercel
- **Database**: Railway PostgreSQL
- **SSL**: Automatic (Railway + Vercel)

---

## 📈 Roadmap

### ✅ Phase 1: MVP (Complete)
- [x] User authentication
- [x] Market orders via Binance
- [x] Manual deposit/withdrawal approval
- [x] Admin panel
- [x] SEO optimization

### 🚧 Phase 2: Automation (Month 2-3)
- [ ] Automated KYC (Sumsub integration)
- [ ] Card deposits (Transak integration)
- [ ] Automated withdrawals
- [ ] Email notifications

### 📋 Phase 3: Features (Month 3-6)
- [ ] Limit orders
- [ ] More trading pairs (10+ pairs)
- [ ] Price alerts
- [ ] Advanced charts
- [ ] Mobile app

### 🎯 Phase 4: Scale (Month 6-12)
- [ ] FCA license approval
- [ ] Institutional features
- [ ] API for third-party developers
- [ ] Staking (live implementation)

---

## 💡 Why Broker Model?

Traditional exchanges need:
- ❌ Matching engine (complex)
- ❌ Deep liquidity (£100k+)
- ❌ Market makers (expensive)
- ❌ Complex infrastructure (£200+/month)

Broker model needs:
- ✅ Simple API integration (Binance)
- ✅ Zero upfront liquidity
- ✅ Revenue-share model
- ✅ Cheap infrastructure (£15/month)

**Result**: Launch with £1,000 instead of £100,000

---

## 📊 Revenue Model

- **Trading Fee**: 0.1% per trade
- **Example**: £100,000 volume = £100 revenue
- **Break-even**: ~£50,000/month volume (Month 3-4)
- **Target**: £1,000,000/month volume = £1,000 revenue

### Realistic Projections

| Month | Users | Volume | Revenue | Costs | Profit |
|-------|-------|--------|---------|-------|--------|
| 1 | 50 | £50k | £50 | £16 | +£34 |
| 3 | 200 | £200k | £200 | £16 | +£184 |
| 6 | 1,000 | £1M | £1,000 | £16 | +£984 |
| 12 | 5,000 | £5M | £5,000 | £16 | +£4,984 |

---

## 🔒 Security

- ✅ JWT authentication with refresh tokens
- ✅ bcrypt password hashing (10 rounds)
- ✅ Rate limiting (100 req/15min)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection
- ✅ HTTPS enforced
- ✅ Immutable transaction ledger

---

## 🧪 Testing

```bash
# Backend tests
cd backend-broker
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

---

## 🤝 Contributing

This is a personal/commercial project. If you want to build your own exchange using this code:

1. **Fork the repository**
2. **Follow the guides** in the docs/ folder
3. **Deploy your own instance**
4. **Don't steal the BitCurrent branding** 😊

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note**: While the code is MIT licensed, the "BitCurrent" brand and logo are not included.

---

## 🙏 Acknowledgments

- **Binance** for providing liquidity via broker program
- **Railway.app** for affordable hosting
- **Vercel** for free frontend hosting
- **Next.js** team for an amazing framework

---

## 📞 Contact

- **Website**: [bitcurrent.co.uk](https://bitcurrent.co.uk)
- **Email**: support@bitcurrent.co.uk
- **GitHub**: [github.com/CokeTrader/Bitcurrent](https://github.com/CokeTrader/Bitcurrent)

---

## ⭐ Star This Repo

If you found this helpful, please star the repo! It helps others discover this project.

---

**Built with ❤️ in London, UK**

*Launch your crypto exchange in 2 weeks with £1,000 budget* 🚀
