# 👨‍💻 BitCurrent Developer Guide

**Complete guide for developers working on BitCurrent**

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required software
node --version  # v18.0.0+
npm --version   # v9.0.0+
git --version   # v2.0.0+
psql --version  # v14.0+
```

### Initial Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/CokeTrader/Bitcurrent.git
cd bitcurrent1

# 2. Install dependencies
cd backend-broker && npm install
cd ../frontend && npm install

# 3. Set up environment variables
cp backend-broker/.env.example backend-broker/.env
cp frontend/.env.local.example frontend/.env.local

# 4. Start PostgreSQL (Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:14

# 5. Run migrations
cd backend-broker
npm run migrate:up

# 6. Start services
npm run dev  # Backend on :4000
cd ../frontend
npm run dev  # Frontend on :3000
```

---

## 📂 Project Structure

### Backend (`/backend-broker`)

```
backend-broker/
├── server.js              # Entry point
├── routes/                # API endpoints (thin controllers)
│   ├── orders.js         # Trading endpoints
│   ├── deposits.js       # Payment endpoints
│   └── markets.js        # Market data
├── services/              # Business logic (fat services)
│   ├── order-service.js  # Order management
│   └── analytics-service.js
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication
│   ├── rate-limiter.js   # Rate limiting
│   └── cache.js          # Response caching
├── integrations/          # Third-party APIs
│   ├── alpaca.js         # Trading API
│   ├── stripe.js         # Payments
│   └── email-provider.js
├── compliance/            # Regulatory
│   ├── aml-screening.js
│   └── kyc-verification.js
└── analytics/             # Intelligence
    └── trading-intelligence.js
```

### Frontend (`/frontend`)

```
frontend/
├── app/                   # Next.js App Router
│   ├── (auth)/           # Auth group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Dashboard group
│   │   ├── dashboard/
│   │   └── settings/
│   └── (trading)/        # Trading group
│       └── trade/[pair]/
├── components/
│   ├── trading/          # Trading components
│   ├── dashboard/        # Dashboard components
│   ├── mobile/           # Mobile-specific
│   └── ui/               # Reusable UI
└── lib/                  # Utilities
    ├── api.ts            # API client
    └── hooks.ts          # Custom hooks
```

---

## 🔧 Development Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/limit-order-ui

# 2. Make changes
# Edit files...

# 3. Run tests
npm test

# 4. Run linter
npm run lint

# 5. Commit with conventional commits
git commit -m "feat(trading): Add limit order UI component"

# 6. Push and create PR
git push origin feature/limit-order-ui
```

### Testing Workflow

```bash
# Backend unit tests
cd backend-broker
npm test

# Backend with coverage
npm run test:coverage

# Frontend unit tests
cd frontend
npm test

# E2E tests
npx playwright test

# Specific test file
npx playwright test trading-flow

# Debug mode
npx playwright test --debug
```

---

## 🎨 Code Style Guide

### TypeScript (Frontend)

```typescript
// ✅ Good: Explicit types, clear names
interface TradeFormData {
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
}

export async function placeOrder(data: TradeFormData): Promise<Order> {
  const response = await api.post('/orders', data);
  return response.data.order;
}

// ❌ Bad: No types, unclear
function placeOrder(data: any) {
  return api.post('/orders', data).then(r => r.data.order);
}
```

### JavaScript (Backend)

```javascript
// ✅ Good: JSDoc, error handling
/**
 * Create new order
 * @param {number} userId - User ID
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} Created order
 */
async function createOrder(userId, orderData) {
  try {
    const order = await OrderService.createOrder(userId, orderData);
    logger.info('Order created', { userId, orderId: order.id });
    return order;
  } catch (error) {
    logger.error('Order creation failed', { userId, error: error.message });
    throw error;
  }
}

// ❌ Bad: No docs, no error handling
async function createOrder(userId, orderData) {
  return await OrderService.createOrder(userId, orderData);
}
```

---

## 🧪 Testing Strategy

### Unit Tests (70% coverage minimum)

```javascript
describe('OrderService', () => {
  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      const order = await OrderService.createOrder(1, validOrderData);
      expect(order).toHaveProperty('id');
      expect(order.status).toBe('pending');
    });

    it('should throw on insufficient balance', async () => {
      await expect(
        OrderService.createOrder(1, largeOrderData)
      ).rejects.toThrow('Insufficient balance');
    });

    it('should validate input', async () => {
      await expect(
        OrderService.createOrder(1, { amount: -1 })
      ).rejects.toThrow('Invalid amount');
    });
  });
});
```

### Integration Tests

```javascript
describe('Deposit Flow', () => {
  it('should complete full deposit cycle', async () => {
    // 1. Create Stripe session
    const session = await request(app)
      .post('/api/v1/deposits/stripe-checkout')
      .send({ amount: 100 });

    // 2. Simulate webhook
    const webhook = await request(app)
      .post('/api/v1/deposits/webhook')
      .send(mockStripeEvent);

    // 3. Verify balance updated
    const balance = await request(app)
      .get('/api/v1/account/balance')
      .expect(200);

    expect(balance.body.balances.GBP).toBeGreaterThan(100);
  });
});
```

### E2E Tests

```typescript
test('User can complete full trading flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Start Trading');
  // Registration flow
  await page.fill('[name="email"]', 'test@example.com');
  // ... complete flow
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 🔒 Security Best Practices

### Input Validation

```javascript
// ✅ Always validate and sanitize
const { sanitizeNumber, sanitizeTradingPair } = require('../middleware/input-sanitizer');

router.post('/orders', (req, res) => {
  const amount = sanitizeNumber(req.body.amount, { min: 0.00000001, decimals: 8 });
  const pair = sanitizeTradingPair(req.body.pair);
  
  if (!amount || !pair) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // Proceed...
});
```

### SQL Queries

```javascript
// ✅ Always use parameterized queries
const qb = new QueryBuilder(pool);
const users = await qb.select('users', { email: userEmail });

// ❌ NEVER concatenate user input
const sql = `SELECT * FROM users WHERE email = '${userEmail}'`; // DANGEROUS!
```

### Secrets Management

```javascript
// ✅ Environment variables only
const apiKey = process.env.STRIPE_SECRET_KEY;

// ❌ Never hardcode
const apiKey = 'sk_live_abc123...'; // NEVER DO THIS!
```

---

## 🐛 Debugging Guide

### Backend Debugging

```bash
# Start with debug logging
DEBUG=* npm run dev

# Use Node debugger
node --inspect server.js

# Check logs
tail -f logs/app.log

# Database queries
psql $DATABASE_URL
\x  # Expanded display
SELECT * FROM orders WHERE user_id = 1;
```

### Frontend Debugging

```bash
# React DevTools (browser extension)
# Redux DevTools (if using Redux)

# Check bundle size
npm run analyze

# Lighthouse audit
npx lighthouse http://localhost:3000
```

---

## 🔄 Common Tasks

### Add New API Endpoint

```javascript
// 1. Create route (backend-broker/routes/my-feature.js)
const express = require('express');
const router = express.Router();

router.get('/', enhancedAuth, async (req, res) => {
  // Implementation
});

module.exports = router;

// 2. Register in server.js
app.use('/api/v1/my-feature', require('./routes/my-feature'));

// 3. Add tests
// 4. Update API docs
```

### Add New UI Component

```typescript
// 1. Create component (frontend/components/my-component.tsx)
'use client';

interface Props {
  // Define props
}

export default function MyComponent({ }: Props) {
  return <div>Component</div>;
}

// 2. Import and use
import MyComponent from '@/components/my-component';

// 3. Add tests
// 4. Update Storybook (optional)
```

---

## 🚨 Troubleshooting

### Common Issues

**Issue:** `ECONNREFUSED` connecting to database  
**Solution:** Ensure PostgreSQL is running on port 5432

**Issue:** Next.js build fails  
**Solution:** Clear `.next` folder and rebuild

**Issue:** CORS errors  
**Solution:** Check `FRONTEND_URL` in backend `.env`

**Issue:** Stripe webhook not working  
**Solution:** Use Stripe CLI to forward webhooks locally

---

## 📚 Resources

- [API Documentation](API.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Happy Coding! 🚀**

