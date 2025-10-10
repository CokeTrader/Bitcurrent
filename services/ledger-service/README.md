# BitCurrent Ledger Service

Double-entry accounting system for balance management and transaction journaling.

## Features

- Atomic balance updates with PostgreSQL transactions
- Double-entry ledger for complete audit trail
- Balance reservation (for pending orders)
- Transaction history with pagination
- Reconciliation reports
- Account freeze/unfreeze capability

## Endpoints

### Balance Operations

- `GET /internal/v1/balances/{account_id}` - Get all balances
- `GET /internal/v1/balances/{account_id}/{currency}` - Get single balance
- `POST /internal/v1/balances/reserve` - Reserve balance (for orders)
- `POST /internal/v1/balances/release` - Release reserved balance
- `POST /internal/v1/balances/update` - Update balance with ledger entry

### Transaction Operations

- `POST /internal/v1/transactions` - Create transaction
- `GET /internal/v1/transactions/{account_id}` - List transactions

### Reconciliation

- `POST /internal/v1/reconciliation/run` - Run reconciliation
- `GET /internal/v1/reconciliation/report` - Get reconciliation report

## Building

```bash
go build -o bin/ledger-service ./cmd
```

## Running

```bash
export DATABASE_URL=postgres://...
./bin/ledger-service
```

## Docker

```bash
docker build -t bitcurrent/ledger-service:latest .
docker run -p 8082:8082 bitcurrent/ledger-service:latest
```

## Architecture

```
┌─────────────┐
│ API Gateway │
│  (requests) │
└──────┬──────┘
       │ HTTP
┌──────▼────────┐
│ Ledger Service│
│  (accounting) │
└──────┬────────┘
       │ SQL
┌──────▼────────┐
│  PostgreSQL   │
│   (wallets,   │
│    ledger)    │
└───────────────┘
```

## Balance Management

### Reserve Flow (for order placement)
1. Lock wallet row with `FOR UPDATE`
2. Check available balance >= amount
3. Move from available → reserved
4. Commit transaction

### Release Flow (on order cancellation)
1. Lock wallet row
2. Move from reserved → available
3. Commit transaction

### Update Flow (on trade execution)
1. Lock wallet rows for both parties
2. Update balances (buy/sell)
3. Create ledger entries
4. Commit transaction

## Double-Entry Accounting

Every balance change creates a ledger entry with:
- Amount (positive or negative)
- Balance after
- Entry type (deposit, withdrawal, trade, fee)
- Reference (order ID, trade ID, etc.)
- Description

This ensures:
- Complete audit trail
- Ability to reconstruct balances
- Detect discrepancies
- Regulatory compliance

## Reconciliation

Daily reconciliation compares:
- Wallet balances (current state)
- Sum of ledger entries (should match)

Reports any discrepancies for investigation.



