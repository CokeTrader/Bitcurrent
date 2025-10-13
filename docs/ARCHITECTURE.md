# 🏗️ BitCurrent Architecture

**System Design & Technical Architecture**

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                 │
└───────┬──────────────────────────────┬─────────────────┘
        │                              │
        ▼                              ▼
┌───────────────┐              ┌──────────────────┐
│   Frontend    │              │   Backend API    │
│   (Next.js)   │◄────────────►│   (Express)      │
│   Vercel      │              │   Railway        │
└───────────────┘              └────────┬─────────┘
                                        │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
            │  PostgreSQL  │   │    Redis     │  │   WebSocket  │
            │   Database   │   │    Cache     │  │   Server     │
            └──────────────┘   └──────────────┘  └──────────────┘
                    │
                    ▼
            ┌──────────────────────────────────┐
            │      External Services           │
            ├──────────────┬───────────────────┤
            │ Alpaca API   │ Stripe  │ Twilio │
            └──────────────┴───────────────────┘
```

---

## 🎯 Component Breakdown

### Frontend Layer (Next.js 14)

**Technology Stack:**
- React 18 (Server + Client Components)
- TypeScript (strict mode)
- Tailwind CSS + Framer Motion
- TradingView widgets
- Recharts for analytics
- WebSocket client

**Key Features:**
- Server-side rendering (SEO)
- Static generation for marketing pages
- Client-side interactivity for trading
- Real-time price updates (WebSocket)
- Progressive Web App (Service Worker)
- Offline support
- Code splitting (dynamic imports)
- Image optimization (Next/Image)

**File Structure:**
```
frontend/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── (trading)/         # Trading routes
│   └── api/               # API routes (middleware)
├── components/
│   ├── trading/           # Trading components
│   ├── dashboard/         # Dashboard components
│   ├── mobile/            # Mobile-specific
│   ├── admin/             # Admin panel
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities
├── hooks/                 # Custom React hooks
└── tests/                 # E2E tests
```

---

### Backend Layer (Node.js + Express)

**Technology Stack:**
- Node.js 18 (LTS)
- Express 4
- PostgreSQL 14 (primary database)
- Redis 7 (caching + sessions)
- WebSocket (ws library)
- JWT authentication

**Architecture Patterns:**
- **Service Layer:** Business logic separated from routes
- **Repository Pattern:** Database access abstraction
- **Middleware Chain:** Auth → Validation → Business logic
- **Event-Driven:** WebSocket broadcasts, notifications

**File Structure:**
```
backend-broker/
├── routes/                # API endpoints
│   ├── orders.js         # Trading routes
│   ├── deposits.js       # Deposit routes
│   ├── markets.js        # Market data
│   └── admin.js          # Admin routes
├── services/              # Business logic
│   ├── order-service.js
│   ├── deposit-service.js
│   └── analytics-service.js
├── middleware/            # Express middleware
│   ├── auth.js
│   ├── rate-limiter.js
│   └── security.js
├── database/              # Data access
│   ├── query-builder.js  # Safe SQL
│   └── pool-optimizer.js
├── integrations/          # Third-party APIs
│   ├── alpaca.js         # Trading
│   ├── stripe.js         # Payments
│   └── coinmarketcap.js  # Market data
├── compliance/            # Regulatory
│   ├── aml-screening.js
│   └── kyc-verification.js
└── analytics/             # Intelligence
    ├── trading-intelligence.js
    └── user-segmentation.js
```

---

## 🗄️ Data Architecture

### Database Schema (PostgreSQL)

**Core Tables:**
- `users` - User accounts
- `balances` - User balances by currency
- `orders` - Trading orders
- `deposits` - Deposit transactions
- `withdrawals` - Withdrawal requests
- `kyc_submissions` - KYC documents
- `api_keys` - User API keys for bots

**Analytics Tables:**
- `user_sessions` - Session tracking
- `user_feedback` - Feedback submissions
- `ab_tests` - A/B testing
- `analytics_events` - Event tracking

**Compliance Tables:**
- `aml_screenings` - AML risk assessments
- `transaction_monitoring` - Real-time monitoring
- `audit_logs` - Immutable audit trail

**Indexes:**
```sql
-- Performance indexes
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_balances_user_currency ON balances(user_id, currency);
CREATE INDEX idx_deposits_user_status ON deposits(user_id, status);

-- Compliance indexes
CREATE INDEX idx_aml_risk_score ON aml_screenings(risk_score DESC);
CREATE INDEX idx_transactions_monitoring ON transaction_monitoring(requires_review, monitored_at);
```

---

## 🔄 Data Flow

### Trading Flow

```
1. User places order (Frontend)
2. JWT validation (Middleware)
3. Input sanitization (Middleware)
4. CSRF check (Middleware)
5. Balance validation (Service)
6. Place order with Alpaca (Integration)
7. Record in database (Repository)
8. Broadcast via WebSocket (Real-time)
9. Send email confirmation (Notification)
10. Update analytics (Background)
```

### Deposit Flow (Stripe)

```
1. User initiates deposit (Frontend)
2. Create Stripe session (Service)
3. Redirect to Stripe checkout
4. User completes payment
5. Stripe webhook → Backend
6. Verify webhook signature (Security)
7. Update deposit status (Database)
8. Credit user balance (Atomic transaction)
9. Check signup bonus eligibility
10. Send confirmation email
11. Broadcast balance update (WebSocket)
```

---

## 🔐 Security Architecture

**Authentication Layers:**
1. JWT tokens (24h expiry)
2. 2FA (TOTP for sensitive operations)
3. API keys (for trading bots)
4. Session management
5. IP whitelisting (admin routes)

**Data Protection:**
- Encryption at rest (AES-256)
- TLS 1.3 in transit
- Password hashing (bcrypt, cost 12)
- API key hashing (SHA-256)
- PII encryption

**Security Middleware Stack:**
```javascript
[
  helmet(),              // Security headers
  cors(),                // CORS policy
  rateLimiter(),         // Rate limiting
  csrfProtection(),      // CSRF tokens
  inputSanitizer(),      // XSS prevention
  enhancedAuth(),        // JWT validation
  requireKYC(),          // Compliance gates
  require2FA()           // 2FA for withdrawals
]
```

---

## ⚡ Performance Architecture

**Caching Strategy:**
- **L1 (Redis):** API responses (60s-10min TTL)
- **L2 (CDN):** Static assets (1 year)
- **L3 (Browser):** Service Worker cache

**Caching Examples:**
- Market prices: 5s
- User balances: 30s
- Order book: 10s
- Market metadata: 24h
- Static content: 1 year

**Database Optimization:**
- Connection pooling (5-20 connections)
- Parameterized queries (SQL injection prevention)
- Query result caching
- Index optimization
- Read replicas (future)

**API Optimization:**
- Response compression (gzip)
- Request coalescing (duplicate prevention)
- Lazy loading
- Pagination (default 50, max 500)
- Field selection

---

## 📊 Monitoring & Observability

**Metrics Collection:**
- Prometheus (system metrics)
- Custom metrics (business KPIs)
- Error tracking
- Performance monitoring

**Dashboards (Grafana):**
- System health
- API performance
- Trading volume
- User activity
- Error rates

**Alerting:**
- High error rate (>5%)
- Slow responses (>1s p95)
- Database connection issues
- Cache failures
- Compliance violations

---

## 🚀 Deployment Architecture

**CI/CD Pipeline:**
```
1. Push to main
2. Run tests (unit + integration + E2E)
3. Security scan (TruffleHog + Snyk)
4. Build Docker images
5. Deploy to staging
6. Run smoke tests
7. Deploy to production (blue-green)
8. Health checks
9. Monitor metrics
```

**Environments:**
- **Development:** Local Docker Compose
- **Staging:** Railway (preview deployments)
- **Production:** Railway (backend) + Vercel (frontend)
- **Future:** Kubernetes on AWS EKS

---

## 📈 Scaling Strategy

**Horizontal Scaling:**
- Backend: 3-10 pods (K8s HPA)
- Database: Read replicas
- Redis: Cluster mode
- WebSocket: Sticky sessions

**Vertical Scaling:**
- Backend: 256MB → 2GB RAM
- Database: 1GB → 8GB RAM
- Redis: 256MB → 1GB RAM

**CDN Strategy:**
- CloudFlare (global CDN)
- Edge caching
- DDoS protection
- SSL termination

---

## 🔧 Technology Decisions

**Why Next.js?**
- SEO-friendly (SSR)
- Fast development
- Built-in optimization
- Vercel deployment

**Why PostgreSQL?**
- ACID compliance
- Complex queries
- Reliability
- JSON support

**Why Redis?**
- Sub-millisecond latency
- Pub/sub for WebSocket
- Session storage
- Rate limiting

**Why Railway?**
- Easy deployment
- Built-in PostgreSQL
- Auto-scaling
- Affordable

---

## 📐 Design Patterns

**Backend Patterns:**
- Service layer (business logic)
- Repository (data access)
- Factory (service creation)
- Singleton (connections)
- Observer (WebSocket)
- Strategy (A/B testing)

**Frontend Patterns:**
- Component composition
- Custom hooks
- Context API (global state)
- Render props
- Higher-order components

---

## 🛡️ Disaster Recovery

**Backup Strategy:**
- Database: Daily automated backups (Railway)
- Retention: 30 days
- Point-in-time recovery: 7 days
- Geographic redundancy: US + EU

**Recovery Procedures:**
1. Database restore (< 1 hour)
2. Re-deploy services (< 10 minutes)
3. Verify data integrity
4. Resume operations

---

**Architecture Status:** Production-Ready ✅  
**Last Updated:** October 13, 2025

