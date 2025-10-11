# BitCurrent Backend - Broker Model

Simplified cryptocurrency exchange backend using the broker model with Binance as liquidity provider.

## Features

✅ User authentication (JWT)
✅ Market orders (BUY/SELL)
✅ Balance tracking (multi-currency)
✅ Manual deposit approval
✅ Manual withdrawal approval
✅ Admin panel for operations
✅ Transaction history
✅ Binance integration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Liquidity**: Binance API
- **Auth**: JWT + bcrypt

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `DATABASE_URL`: PostgreSQL connection string
- `BINANCE_API_KEY`: Your Binance API key
- `BINANCE_API_SECRET`: Your Binance API secret
- `JWT_SECRET`: Random secret for JWT signing

### 3. Initialize Database

```bash
# Run schema migration
psql $DATABASE_URL < database/schema.sql
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Orders
- `GET /api/v1/orders/quote` - Get order quote
- `POST /api/v1/orders` - Place market order
- `GET /api/v1/orders` - Get order history
- `GET /api/v1/orders/:id` - Get order details

### Balances
- `GET /api/v1/balances` - Get all balances
- `GET /api/v1/balances/:currency` - Get specific balance
- `GET /api/v1/balances/transactions/history` - Transaction history

### Deposits
- `POST /api/v1/deposits` - Create deposit request
- `GET /api/v1/deposits` - Get deposit history
- `GET /api/v1/deposits/:id` - Get deposit details

### Withdrawals
- `POST /api/v1/withdrawals` - Create withdrawal request
- `GET /api/v1/withdrawals` - Get withdrawal history
- `GET /api/v1/withdrawals/:id` - Get withdrawal details
- `DELETE /api/v1/withdrawals/:id` - Cancel withdrawal

### Admin (requires admin auth)
- `GET /api/v1/admin/deposits/pending` - Pending deposits
- `POST /api/v1/admin/deposits/:id/approve` - Approve deposit
- `POST /api/v1/admin/deposits/:id/reject` - Reject deposit
- `GET /api/v1/admin/withdrawals/pending` - Pending withdrawals
- `POST /api/v1/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/v1/admin/withdrawals/:id/complete` - Complete withdrawal
- `POST /api/v1/admin/withdrawals/:id/reject` - Reject withdrawal
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/stats` - Platform statistics

## Deployment

### Railway.app (Recommended)

1. Sign up at https://railway.app
2. Create new project
3. Connect GitHub repository
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

Cost: £15/month (includes database)

### Manual Deployment

1. Set up PostgreSQL database
2. Run schema migrations
3. Configure environment variables
4. Start with `npm start`
5. Use PM2 or systemd for process management

## Manual Operations (First 100 Users)

### Approve Deposits
1. User sends bank transfer with reference code
2. Check your bank statement daily
3. Match reference to deposit request
4. Call `/api/v1/admin/deposits/:id/approve`

### Process Withdrawals
1. Approve withdrawal via API
2. Process via Binance or bank transfer manually
3. Get transaction ID
4. Call `/api/v1/admin/withdrawals/:id/complete`

## Security

- All passwords hashed with bcrypt
- JWT for authentication
- Rate limiting on all routes
- Helmet for HTTP security headers
- CORS configured for frontend only
- SQL injection protection via parameterized queries

## Support

Email: support@bitcurrent.co.uk

