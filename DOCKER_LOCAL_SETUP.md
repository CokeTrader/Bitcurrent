# 🐳 Docker Local Setup Guide

**Run BitCurrent locally with all 500 commits!**

---

## 🚀 Quick Start (2 Minutes)

### Prerequisites
```bash
# Check you have Docker installed
docker --version
docker-compose --version
```

### Launch Everything

```bash
# Navigate to project
cd /Users/poseidon/monivo/bitcurrent/bitcurrent1

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

**Services will be available at:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

## 📋 What Gets Deployed

### All 500 Commits Worth of Features:

**Frontend (Port 3000):**
- Landing page with conversion optimization
- User registration/login
- Trading interface (BTC/ETH/SOL/ADA/DOT)
- Portfolio dashboard
- Deposit page (Stripe test mode)
- Withdrawal page
- Settings page
- KYC verification
- Security settings (2FA)
- API key management
- Mobile-optimized design
- PWA support
- Offline mode

**Backend (Port 4000):**
- REST API (60+ endpoints)
- WebSocket server (real-time prices)
- Authentication (JWT + 2FA)
- Trading engine integration
- Payment processing (Stripe)
- KYC/AML compliance
- Analytics engine
- Notification system
- Admin dashboard
- Health monitoring

**Databases:**
- PostgreSQL (user data, transactions)
- Redis (caching, sessions)

---

## 🧪 Testing the Platform

### 1. Access Homepage
```bash
# Open browser
open http://localhost:3000
```

**What to test:**
- Hero section with "0.25% fees" messaging
- "Get £10 Free" CTA button
- Features section
- Social proof section
- Responsive design (resize browser)

### 2. Create Account
```
Email: test@example.com
Password: Test1234!@#$
```

**What to test:**
- Registration form validation
- Email format checking
- Password strength requirements
- Success redirect to dashboard

### 3. Explore Dashboard
```
http://localhost:3000/dashboard
```

**What to test:**
- Portfolio overview
- Balance display
- Holdings list
- Quick stats
- Performance metrics
- Transaction timeline

### 4. Try Trading
```
http://localhost:3000/trade/BTCUSD
```

**What to test:**
- Real-time price updates (via WebSocket)
- TradingView chart integration
- Order panel (market/limit/stop-loss/take-profit)
- Buy/Sell toggling
- Amount input with validation
- Fee calculation display
- Order placement

### 5. Test Deposit (Test Mode)
```
http://localhost:3000/deposit
```

**What to test:**
- Stripe checkout integration
- Amount validation (min £10)
- Redirect to Stripe (test mode)
- Use test card: 4242 4242 4242 4242

### 6. Check Mobile View
```
# Open DevTools (F12)
# Click device toolbar (Ctrl+Shift+M)
# Select iPhone or Android
```

**What to test:**
- Bottom navigation
- Mobile dashboard
- Quick trade FAB (floating button)
- Touch-optimized buttons
- Responsive layout

### 7. Test API Directly
```bash
# Health check
curl http://localhost:4000/health

# Get markets
curl http://localhost:4000/api/v1/markets

# Get Bitcoin price
curl http://localhost:4000/api/v1/markets/BTCUSD/ticker
```

---

## 🔍 Monitoring & Debugging

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Check Service Status
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Access Database
```bash
docker exec -it bitcurrent-postgres psql -U bitcurrent -d bitcurrent

# Useful commands:
\dt                    # List tables
\d users               # Describe users table
SELECT * FROM users;   # Query users
\q                     # Quit
```

### Access Redis
```bash
docker exec -it bitcurrent-redis redis-cli

# Commands:
KEYS *                 # List all keys
GET api:markets        # Get cached market data
FLUSHALL               # Clear all cache
```

---

## 🛠️ Development Workflow

### Make Code Changes
```bash
# Backend changes auto-reload (nodemon)
# Frontend changes auto-reload (Next.js)
# Just edit files and save!
```

### Restart Services
```bash
# Restart single service
docker-compose -f docker-compose.dev.yml restart backend

# Restart all
docker-compose -f docker-compose.dev.yml restart
```

### Rebuild After Package Changes
```bash
# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 🧹 Cleanup

### Stop Services
```bash
docker-compose -f docker-compose.dev.yml down
```

### Stop and Remove Volumes (Fresh Start)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

### Database Connection Error
```bash
# Wait for PostgreSQL to be ready
docker-compose -f docker-compose.dev.yml logs postgres

# Manually run migrations
docker exec -it bitcurrent-backend npm run migrate:up
```

### Frontend Build Issues
```bash
# Clear Next.js cache
docker exec -it bitcurrent-frontend rm -rf .next

# Rebuild
docker-compose -f docker-compose.dev.yml restart frontend
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Homepage loads at http://localhost:3000
- ✅ API responds at http://localhost:4000/health
- ✅ Can create account and log in
- ✅ Can view real-time prices
- ✅ Can access all pages without errors
- ✅ Database contains test user
- ✅ Redis has cached data

---

**Ready to test all 500 commits! 🎉**

