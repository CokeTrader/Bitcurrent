# BitCurrent Broker Model Architecture - Implementation Guide

## High-Level Architecture

```
User UI → BitCurrent Backend (Order & Wallet Manager + Ledger) → 
Liquidity Provider(s) via API → Omnibus Hot Wallet / Provider Custody → 
On-chain / Bank Rails for Settlements
```

This document provides a comprehensive guide for implementing a broker model cryptocurrency exchange, suitable for startups with limited capital.

---

## 1. Architecture Overview

### What is a Broker Model?

Unlike running your own order book and matching engine, a **broker model** routes customer orders to external liquidity providers (Binance, Kraken, OTC desks). You:

- **Don't hold inventory** (providers execute trades from their liquidity)
- **Lower capital requirements** (no need to maintain order book liquidity)
- **Faster time to market** (no matching engine to build)
- **Regulatory simplicity** (you're an intermediary, not a market operator)

### Trade Flow Example

1. User wants to buy £1,000 of BTC
2. Your backend queries multiple providers for best quote
3. Best price: £43,250/BTC from Binance
4. You route order to Binance via API
5. Binance fills order and credits your omnibus account
6. You credit user's BTC balance in your ledger
7. Reconciliation service confirms blockchain settlement

---

## 2. Core Components

### A. Front-End (Customer-Facing)

**Technology**: React / Next.js (currently implemented ✅)

**Features Required**:
- ✅ Signup/KYC flow
- ✅ Order entry (market/limit)
- ✅ Balances display
- ✅ Deposits/withdrawals
- ✅ Trade history
- ✅ Support widget
- ✅ Fees page
- ✅ Legal pages

**Mobile Strategy**:
- Phase 1: Responsive web (✅ Currently live)
- Phase 2: PWA (Progressive Web App)
- Phase 3: Native iOS/Android apps

**Current Status**: ✅ Fully implemented and deployed

---

### B. API Layer

**REST API**:
- Authentication endpoints (login, register, 2FA)
- Order management (create, cancel, get)
- Account endpoints (balances, transactions)
- Market data (prices, orderbook, charts)

**WebSocket**:
- Real-time price updates
- Order status changes
- Balance updates
- Trade notifications

**Authentication**:
- JWT tokens (access + refresh)
- Device fingerprinting
- 2FA enforcement for withdrawals
- Session management

**Current Implementation**: ✅ API Gateway in Go with all endpoints

---

### C. Backend Services (Microservices Architecture)

#### 1. Order Router Service

**Purpose**: Aggregate quotes, route orders, manage slippage

**Key Functions**:
```go
// Get best quote from multiple providers
func GetBestQuote(symbol string, side string, amount decimal.Decimal) (*Quote, error)

// Route order to selected provider
func RouteOrder(order *Order, provider string) (*ProviderFill, error)

// Handle partial fills and smart order routing
func ExecuteWithSlippageControl(order *Order, maxSlippage decimal.Decimal) error
```

**Responsibilities**:
- Query multiple providers for quotes
- Calculate all-in price (including fees)
- Select best provider based on price + reliability
- Handle order splitting for large amounts
- Slippage protection

**Current Status**: Partially implemented in Order Gateway

---

#### 2. Execution Adapter(s)

**Purpose**: Wrapper for each liquidity provider's API

**Pattern**:
```go
type ExecutionAdapter interface {
    GetQuote(symbol string, side string, amount decimal.Decimal) (*Quote, error)
    PlaceOrder(order *Order) (*ProviderFill, error)
    CancelOrder(providerOrderID string) error
    GetOrderStatus(providerOrderID string) (*OrderStatus, error)
    GetBalance(currency string) (*Balance, error)
}

type BinanceAdapter struct {
    apiKey string
    apiSecret string
    client *http.Client
}

func (b *BinanceAdapter) PlaceOrder(order *Order) (*ProviderFill, error) {
    // Binance-specific API call
    // Handle rate limits, retries, error mapping
}
```

**Providers to Integrate**:
- **Binance**: High liquidity, good API
- **Kraken**: UK-friendly, good support
- **Bitstamp**: Established, reliable
- **B2Broker**: Aggregator with multiple sources
- **OTC Desks**: For large orders (>£50k)

**Implementation Priority**:
1. Start with ONE provider (Binance or Kraken)
2. Add fallback provider (redundancy)
3. Add OTC desk for large orders
4. Expand as volume grows

**Current Status**: Basic provider integration exists

---

#### 3. Ledger Service (Single Source of Truth)

**Purpose**: Maintain authoritative user balances with immutable audit trail

**Core Principle**: **Every balance change must be recorded as an immutable ledger entry**

**Key Functions**:
```go
// Debit/Credit operations (atomic)
func Debit(accountID uuid.UUID, currency string, amount decimal.Decimal, ref string) error
func Credit(accountID uuid.UUID, currency string, amount decimal.Decimal, ref string) error

// Two-phase commit pattern
func Reserve(accountID uuid.UUID, currency string, amount decimal.Decimal) (*Reservation, error)
func CommitReservation(reservationID uuid.UUID) error
func RollbackReservation(reservationID uuid.UUID) error

// Balance queries
func GetBalance(accountID uuid.UUID, currency string) (*Balance, error)
func GetAvailableBalance(accountID uuid.UUID, currency string) (decimal.Decimal, error)
```

**Database Schema**:
```sql
-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    available_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    reserved_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, currency),
    CHECK (balance = available_balance + reserved_balance)
);

-- Ledger entries (IMMUTABLE - append-only)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    amount DECIMAL(36, 18) NOT NULL, -- Positive = credit, Negative = debit
    balance_before DECIMAL(36, 18) NOT NULL,
    balance_after DECIMAL(36, 18) NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- 'DEPOSIT', 'TRADE', 'WITHDRAWAL', etc.
    reference_id UUID NOT NULL, -- ID of related record (order, deposit, etc.)
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID, -- User or system that initiated
    INDEX(account_id, created_at),
    INDEX(reference_type, reference_id)
);

-- Prevent updates or deletes on ledger
CREATE TRIGGER prevent_ledger_update 
    BEFORE UPDATE ON ledger_entries 
    FOR EACH ROW EXECUTE FUNCTION reject_update();

CREATE TRIGGER prevent_ledger_delete 
    BEFORE DELETE ON ledger_entries 
    FOR EACH ROW EXECUTE FUNCTION reject_delete();
```

**Critical Rules**:
1. **Immutability**: Ledger entries NEVER update or delete
2. **Atomicity**: Balance changes happen in transactions
3. **Auditability**: Every penny traceable to source
4. **Consistency**: `balance = available + reserved` always true

**Current Status**: ✅ Ledger Service implemented

---

#### 4. Wallet Service

**Purpose**: Manage hot wallets, process withdrawals, maintain float

**Key Functions**:
```go
// Withdrawal processing
func QueueWithdrawal(withdrawalID uuid.UUID) error
func ProcessWithdrawal(withdrawalID uuid.UUID) (*OnChainTx, error)
func SignTransaction(tx *UnsignedTx) (*SignedTx, error)

// Hot wallet management
func GetHotWalletBalance(currency string) (*Balance, error)
func TopUpHotWallet(currency string, amount decimal.Decimal) error
func SweepToHotWallet(currency string) error

// Withdrawal limits and controls
func CheckWithdrawalLimits(userID uuid.UUID, amount decimal.Decimal) error
func RequiresManualApproval(withdrawal *Withdrawal) bool
```

**Hot Wallet Strategy**:

**Option A: Use Provider Omnibus (Recommended for MVP)**
- Provider holds your crypto in their custody
- You maintain API balance
- Withdrawals processed via provider API
- **Pros**: No key management, faster setup, lower risk
- **Cons**: Trust in provider, withdrawal limits

**Option B: Self-Custody with BitGo/Fireblocks**
- You control keys via MPC/HSM
- More control and flexibility
- **Pros**: Full custody control, no provider risk
- **Cons**: Higher cost, complexity, security responsibility

**MVP Recommendation**: Start with Option A, migrate to Option B as you scale

**Hot Wallet Float Management**:
```
Daily BTC withdrawals: ~2 BTC
Hot wallet minimum: 5 BTC
Top-up threshold: When < 3 BTC
Top-up amount: 5 BTC from custody

Automated monitoring:
IF hot_wallet_balance < threshold THEN
    alert ops team
    trigger auto top-up from cold storage
```

**Current Status**: Basic wallet management implemented

---

#### 5. Reconciliation Service

**Purpose**: Match provider fills with on-chain reality and ledger state

**Critical Checks**:
1. **Provider vs Ledger**: Does provider fill match ledger credit?
2. **Provider vs On-Chain**: Did provider actually send crypto on-chain?
3. **Ledger vs On-Chain**: Does user balance equal on-chain holdings?

**Reconciliation Flow**:
```
Every 15 minutes:
1. Fetch provider balances (API)
2. Fetch on-chain balances (blockchain)
3. Fetch ledger balances (database)
4. Compare all three:
   
   Expected: provider_balance + on_chain_balance = ledger_total_balance
   
5. If mismatch:
   - Log discrepancy
   - Alert ops team
   - Halt withdrawals for that currency
   - Investigate
```

**Database Schema**:
```sql
CREATE TABLE reconciliation_runs (
    id UUID PRIMARY KEY,
    currency VARCHAR(10) NOT NULL,
    provider_balance DECIMAL(36, 18),
    on_chain_balance DECIMAL(36, 18),
    ledger_balance DECIMAL(36, 18),
    discrepancy DECIMAL(36, 18),
    status VARCHAR(20), -- 'MATCHED', 'DISCREPANCY', 'INVESTIGATING'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE provider_fills (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_order_id VARCHAR(100) NOT NULL,
    our_order_id UUID REFERENCES orders(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(4) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) NOT NULL,
    status VARCHAR(20) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_order_id)
);
```

**Current Status**: Settlement service exists, needs reconciliation enhancement

---

#### 6. KYC/AML Service

**Purpose**: Identity verification, sanctions screening, risk assessment

**KYC Tiers**:

**Tier 0 (Email Only)**:
- Limits: View-only, no trading
- Required: Email verification

**Tier 1 (Basic)**:
- Limits: £1,000/day trading, £500/day withdrawal
- Required: Name, DOB, address, phone

**Tier 2 (Intermediate)**:
- Limits: £10,000/day trading, £5,000/day withdrawal
- Required: Photo ID + selfie + proof of address

**Tier 3 (Advanced)**:
- Limits: £100,000/day trading, £50,000/day withdrawal
- Required: Source of funds, enhanced due diligence

**Database Schema**:
```sql
CREATE TABLE kyc_submissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    tier INT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
    provider VARCHAR(50), -- 'ONFIDO', 'SUMSUB', etc.
    provider_applicant_id VARCHAR(100),
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    rejection_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE aml_checks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    check_type VARCHAR(50), -- 'SANCTIONS', 'PEP', 'ADVERSE_MEDIA'
    provider VARCHAR(50), -- 'CHAINALYSIS', 'ELLIPTIC'
    result VARCHAR(20), -- 'CLEAR', 'HIT', 'FALSE_POSITIVE'
    risk_score INT,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Recommended Providers**:
- **KYC**: Onfido (£1-3 per check), Sumsub (£0.50-2 per check)
- **AML**: Chainalysis (blockchain analysis), Elliptic (sanctions screening)

**Current Status**: ✅ Basic KYC flow implemented

---

#### 7. Payments Service

**Purpose**: Fiat on-ramp and off-ramp (GBP deposits/withdrawals)

**Integration Options**:

**For GBP Deposits**:
- **Modulr**: UK bank-as-a-service, virtual accounts
- **ClearBank**: Banking infrastructure
- **BCB Group**: Crypto-friendly banking
- **Faster Payments**: Direct bank integration

**For Card Payments**:
- **Transak**: Crypto on-ramp (2.99% fee)
- **MoonPay**: Global coverage (4.5% fee)
- **Banxa**: Competitive rates (3.5% fee)

**Database Schema**:
```sql
CREATE TABLE deposits (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    payment_method VARCHAR(50), -- 'BANK_TRANSFER', 'DEBIT_CARD', etc.
    provider VARCHAR(50),
    provider_tx_id VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'CONFIRMED', 'FAILED'
    ledger_entry_id UUID REFERENCES ledger_entries(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP
);

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) NOT NULL,
    destination_address TEXT, -- Crypto address or bank details
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED'
    tx_hash VARCHAR(100), -- On-chain transaction hash
    provider VARCHAR(50),
    approved_by UUID,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX(user_id, created_at),
    INDEX(status)
);
```

**Current Status**: ✅ Basic deposit/withdrawal flow implemented

---

#### 8. Admin / Ops Console

**Purpose**: Manual operations, monitoring, KYC review

**Features Needed**:
- KYC application review dashboard
- Withdrawal approval queue (>£10k requires manual approval)
- User account management
- Transaction investigation tools
- System health monitoring
- Reconciliation status
- Audit log viewer

**Security**:
- Role-based access control (RBAC)
- All actions logged
- Multi-signature for critical operations
- IP whitelisting

**Current Status**: Basic admin functionality exists

---

#### 9. Notification Service

**Purpose**: User communications and alerts

**Channels**:
- Email (transactional via SendGrid/AWS SES)
- SMS (2FA codes, withdrawal confirmations via Twilio)
- Push notifications (mobile apps, later)
- In-app notifications

**Trigger Events**:
- Withdrawal confirmations
- Large trade alerts (>£10k)
- KYC status changes
- Security alerts (new device login)
- Deposit confirmations
- Price alerts (user-configured)

**Current Status**: Basic notifications implemented

---

## 3. Database Schema (Minimum Viable)

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    kyc_status INT NOT NULL DEFAULT 0, -- 0,1,2,3 tiers
    kyc_level INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED', 'CLOSED'
    twofa_enabled BOOLEAN DEFAULT FALSE,
    twofa_secret VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    INDEX(email),
    INDEX(kyc_status)
);
```

#### Accounts Table (User Balances)
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL, -- 'GBP', 'BTC', 'ETH', etc.
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    available_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    reserved_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, currency),
    CHECK (balance >= 0),
    CHECK (available_balance >= 0),
    CHECK (reserved_balance >= 0),
    CHECK (balance = available_balance + reserved_balance)
);
```

#### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    symbol VARCHAR(20) NOT NULL, -- 'BTC-GBP'
    side VARCHAR(4) NOT NULL, -- 'BUY', 'SELL'
    type VARCHAR(10) NOT NULL, -- 'MARKET', 'LIMIT'
    price DECIMAL(36, 18), -- NULL for market orders
    amount DECIMAL(36, 18) NOT NULL,
    filled_amount DECIMAL(36, 18) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    routed_to_provider VARCHAR(50), -- Which provider executed this
    provider_order_id VARCHAR(100), -- Provider's order ID
    average_fill_price DECIMAL(36, 18),
    total_fee DECIMAL(36, 18) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    filled_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    INDEX(user_id, created_at DESC),
    INDEX(status),
    INDEX(symbol, side)
);
```

#### Trades Table
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(4) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) NOT NULL,
    fee_currency VARCHAR(10) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_trade_id VARCHAR(100),
    executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX(user_id, executed_at DESC),
    INDEX(order_id),
    INDEX(symbol, executed_at DESC)
);
```

#### Provider Fills Table
```sql
CREATE TABLE provider_fills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    provider_order_id VARCHAR(100) NOT NULL,
    our_order_id UUID REFERENCES orders(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(4) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED'
    raw_response JSONB, -- Store full provider response
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP,
    executed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_order_id),
    INDEX(our_order_id),
    INDEX(reconciled, executed_at)
);
```

#### Ledger Entries Table (Critical)
```sql
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    change DECIMAL(36, 18) NOT NULL, -- Amount changed (+ or -)
    balance_after DECIMAL(36, 18) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    metadata JSONB, -- Additional context
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- NO updated_at - immutable!
    INDEX(account_id, created_at DESC),
    INDEX(reference_type, reference_id)
);

-- Immutability enforcement
ALTER TABLE ledger_entries ADD CONSTRAINT no_updates 
    CHECK (false); -- This makes updates impossible (drop to allow updates)
```

---

## 4. Order & Settlement Flow (Detailed)

### Happy Path: User Buys £1,000 of BTC

#### Step 1: User Initiates Order
```
POST /api/v1/orders
{
  "symbol": "BTC-GBP",
  "side": "BUY",
  "type": "MARKET",
  "amount": "1000" // GBP
}
```

#### Step 2: Backend Validates & Quotes

```go
// 1. Validate user has sufficient GBP balance
availableGBP := ledger.GetAvailableBalance(userID, "GBP")
if availableGBP < 1000 {
    return ErrInsufficientBalance
}

// 2. Query providers for best quote
quotes := []Quote{
    binanceAdapter.GetQuote("BTC-GBP", "BUY", 1000),
    krakenAdapter.GetQuote("BTC-GBP", "BUY", 1000),
}

// 3. Select best all-in price (price + fees)
bestQuote := selectBestQuote(quotes) // e.g., Binance: 0.02314 BTC for £1000
```

#### Step 3: Reserve Funds (Two-Phase Commit)

```go
// Create order in PENDING status
order := &Order{
    UserID: userID,
    Symbol: "BTC-GBP",
    Side: "BUY",
    Type: "MARKET",
    Amount: 1000,
    Status: "PENDING",
}
db.Create(order)

// Reserve GBP in ledger (atomic transaction)
tx := db.Begin()
{
    // Debit available, credit reserved
    ledger.Reserve(userID, "GBP", 1000, order.ID)
    // accounts.available_balance -= 1000
    // accounts.reserved_balance += 1000
}
tx.Commit()
```

#### Step 4: Execute with Provider

```go
// Call Binance API
providerFill, err := binanceAdapter.PlaceOrder(order)
if err != nil {
    // Roll back reservation
    ledger.RollbackReservation(order.ID)
    order.Status = "FAILED"
    db.Save(order)
    return err
}

// Store provider fill
db.Create(&ProviderFill{
    Provider: "binance",
    ProviderOrderID: providerFill.ID,
    OurOrderID: order.ID,
    Amount: providerFill.Amount, // 0.02314 BTC
    Price: providerFill.Price,
    Fee: providerFill.Fee,
    Status: "FILLED",
})
```

#### Step 5: Update Ledger (Settlement)

```go
tx := db.Begin()
{
    // 1. Debit reserved GBP (remove reservation)
    ledger.DebitReserved(userID, "GBP", 1000, order.ID)
    
    // 2. Credit BTC to user
    ledger.Credit(userID, "BTC", 0.02314, order.ID)
    
    // 3. Debit provider settlement liability
    ledger.Debit(providerAccountID, "BTC", 0.02314, order.ID)
    
    // 4. Update order status
    order.Status = "FILLED"
    order.FilledAmount = 0.02314
    order.AverageFillPrice = 43250.50
    order.FilledAt = time.Now()
    db.Save(order)
}
tx.Commit()

// 5. Send notification
notifications.SendOrderFillEmail(userID, order)
```

#### Step 6: Reconciliation (Background Job)

```go
// Runs every 15 minutes
func ReconcileBTC() {
    // 1. Get provider balance
    providerBalance := binanceAdapter.GetBalance("BTC") // 10.5 BTC
    
    // 2. Get on-chain balance (if self-custody)
    onChainBalance := blockchain.GetBalance(hotWalletAddress) // 8.2 BTC
    
    // 3. Get ledger balance (sum of all user BTC balances)
    ledgerBalance := ledger.GetTotalBalance("BTC") // 18.7 BTC
    
    // 4. Expected: provider + on_chain = ledger
    expected := providerBalance + onChainBalance // 18.7 BTC
    if expected != ledgerBalance {
        alert.Send("BTC reconciliation mismatch!")
        // Log details, halt withdrawals, investigate
    }
}
```

---

## 5. Wallet Operations & Custody

### Broker Model Custody Options

#### Option A: Provider Omnibus Wallets (Recommended MVP)

**How it works**:
- Your crypto sits in provider's custody (Binance, Kraken account)
- You maintain API balance
- Withdrawals processed via provider API
- Provider handles key management, security, compliance

**Pros**:
- ✅ No key management complexity
- ✅ Lower capital requirements
- ✅ Instant setup
- ✅ Provider handles regulatory compliance
- ✅ No security responsibility for keys

**Cons**:
- ❌ Trust required in provider
- ❌ Withdrawal limits
- ❌ Counterparty risk (provider insolvency)
- ❌ Less control

**Cost**: Free to low (revenue share or withdrawal fees)

**Example Providers**:
- Binance omnibus accounts
- Kraken institutional
- Bitstamp corporate
- B2Broker white-label

---

#### Option B: Third-Party Custody (Fireblocks, BitGo)

**How it works**:
- Third-party custodian holds your keys
- You control via API and policy engine
- MPC (multi-party computation) for signing
- Institutional-grade security

**Pros**:
- ✅ Full control of assets
- ✅ Insurance (up to $100M+)
- ✅ Regulatory compliance support
- ✅ No single point of failure

**Cons**:
- ❌ Expensive ($10k-50k/year minimum)
- ❌ Complex setup
- ❌ Requires capital for insurance

**Cost**: $10k-$100k/year depending on volume

**Providers**:
- **Fireblocks**: $10k+/year, excellent API
- **BitGo**: $15k+/year, trusted by Coinbase
- **Coinbase Custody**: $100k+ minimum
- **Copper.co**: £20k+/year

---

#### Option C: Self-Custody (Not Recommended for MVP)

**How it works**:
- You generate and manage private keys
- Multi-sig wallets (3-of-5, etc.)
- Hardware Security Modules (HSMs)
- Manual signing ceremonies

**Pros**:
- ✅ Maximum control
- ✅ No ongoing fees
- ✅ No counterparty risk

**Cons**:
- ❌ Extreme security responsibility
- ❌ Key loss = total fund loss
- ❌ Regulatory complexity
- ❌ Insurance very expensive
- ❌ Operational overhead

**Cost**: £50k-200k setup + ongoing ops cost

**Not recommended unless**:
- You have security expertise
- Volume justifies it (>£10M/month)
- You have insurance coverage

---

### Hot Wallet Float Management

**Calculate Float Requirements**:

```
Daily BTC Withdrawals Estimate:
- 100 users × average £500 withdrawal = £50,000/day
- At £43k/BTC = ~1.16 BTC/day

Safety margin: 3-5 days of withdrawals
Hot wallet target: 5 BTC (£215,000)
```

**Auto Top-Up Logic**:
```go
func MonitorHotWallet() {
    for _, currency := range []string{"BTC", "ETH", "SOL"} {
        balance := getHotWalletBalance(currency)
        threshold := getTopUpThreshold(currency)
        
        if balance < threshold {
            // Alert ops team
            slack.Send(fmt.Sprintf("Hot wallet %s below threshold!", currency))
            
            // Auto top-up from cold storage or provider
            topUpAmount := getTargetBalance(currency) - balance
            initiateTopUp(currency, topUpAmount)
        }
    }
}

// Run every 5 minutes
cron.Schedule("*/5 * * * *", MonitorHotWallet)
```

---

## 6. AML / Compliance Flow

### Onboarding Flow

```
1. User registers (email + password)
   └─> Create user record, status = 'KYC_TIER_0'

2. Email verification required
   └─> Send verification link

3. Basic KYC (Tier 1) - Optional for small amounts
   - Name, DOB, address, phone
   └─> Limits: £1k/day

4. Full KYC (Tier 2) - Required for serious trading
   - Upload photo ID (passport/driving license)
   - Take selfie (liveness check)
   - Proof of address (utility bill <3 months)
   └─> Onfido/Sumsub processes
   └─> Sanctions screening (PEP, OFAC, EU lists)
   └─> Limits: £10k/day

5. Enhanced Due Diligence (Tier 3) - High-value users
   - Source of funds questionnaire
   - Additional documentation
   - Manual review by compliance officer
   └─> Limits: £100k/day
```

### Transaction Monitoring Rules

**Flag for Review**:
- Deposit + immediate withdrawal (structuring)
- Rapid trading (churning)
- Unusual patterns (deposits from many sources)
- High-risk countries
- Amounts >£10,000 in 24h

**Automated Checks**:
```go
type TransactionRule struct {
    Name string
    Check func(tx *Transaction) (bool, string)
}

rules := []TransactionRule{
    {
        Name: "Rapid deposit-withdrawal",
        Check: func(tx *Transaction) (bool, string) {
            // Check if withdrawal within 2 hours of deposit
            recentDeposit := db.Find(&Deposit{
                UserID: tx.UserID,
                CreatedAt: >time.Now().Add(-2 * time.Hour),
            })
            if recentDeposit != nil {
                return true, "Deposit £X at TIME, withdrawal £Y at TIME"
            }
            return false, ""
        },
    },
    {
        Name: "Large single transaction",
        Check: func(tx *Transaction) (bool, string) {
            if tx.Amount > 10000 {
                return true, fmt.Sprintf("Large transaction: £%v", tx.Amount)
            }
            return false, ""
        },
    },
}
```

### SAR (Suspicious Activity Report) Workflow

```
1. Automated rule flags transaction
2. Compliance officer reviews in admin console
3. Officer investigates:
   - User KYC documents
   - Transaction history
   - Source of funds
   - Blockchain analysis (Chainalysis)
4. Decision:
   a) False positive → Clear alert
   b) Suspicious → File SAR with FCA
   c) Critical → Freeze account, report immediately
```

---

## 7. Security & Monitoring

### Authentication Security

**Password Requirements**:
- Minimum 12 characters
- Uppercase, lowercase, numbers, symbols
- Hashed with Argon2 or bcrypt
- Password history (prevent reuse of last 5)

**2FA Enforcement**:
```go
// Required for:
- Withdrawals (always)
- Large trades (>£10k)
- Account settings changes
- Adding withdrawal addresses

// Implementation
func ValidateTOTP(userID uuid.UUID, code string) error {
    secret := getUserTOTPSecret(userID)
    valid := totp.Validate(code, secret)
    if !valid {
        incrementFailedAttempts(userID)
        return ErrInvalidCode
    }
    resetFailedAttempts(userID)
    return nil
}
```

**Session Management**:
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Logout invalidates both
- Device fingerprinting
- IP whitelist option for API users

---

### Network Security

**Infrastructure**:
```
Internet
   ↓
Cloudflare (DDoS protection, WAF, rate limiting)
   ↓
AWS Load Balancer (SSL termination)
   ↓
Public Subnet (API Gateway only)
   ↓ (internal only)
Private Subnet (all backend services)
   ↓
RDS (encrypted database)
```

**Rate Limiting**:
- Public API: 100 requests/minute per IP
- Authenticated: 1000 requests/minute per user
- WebSocket: 100 messages/second per connection
- Withdrawal API: 10 requests/hour per user

**DDoS Protection**:
- Cloudflare proxy
- AWS Shield
- Geographic filtering (block high-risk countries)

---

### Secrets Management

**What to Protect**:
- Database passwords
- API keys (provider APIs)
- JWT signing keys
- Private keys (if self-custody)
- 2FA secrets

**How**:
- **AWS Secrets Manager** or **HashiCorp Vault**
- Never commit secrets to git
- Rotate quarterly
- Different secrets per environment (dev/staging/prod)

```go
// Example: Loading secrets securely
func getProviderAPIKey(provider string) string {
    secret, err := vault.GetSecret(fmt.Sprintf("providers/%s/api_key", provider))
    if err != nil {
        log.Fatal("Failed to load API key")
    }
    return secret
}
```

---

### Logging & SIEM

**What to Log**:
- All API requests (user, endpoint, timestamp, IP)
- All order placements
- All balance changes
- All authentication attempts
- All withdrawals
- All admin actions

**Log Aggregation**:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog** (paid, easier setup)
- **CloudWatch Logs** (AWS native)

**Alerts**:
- Failed login attempts (>5 in 15 min)
- Large withdrawals (>£50k)
- Reconciliation mismatches
- API errors (>1% error rate)
- Hot wallet balance low
- Provider API downtime

---

### Backup & Disaster Recovery

**Database Backups**:
- Automated daily snapshots (AWS RDS)
- Point-in-time recovery (up to 7 days)
- Cross-region replication (DR)
- Test restore monthly

**Code/Infrastructure**:
- All code in git (GitHub/GitLab)
- Infrastructure as code (Terraform)
- Can rebuild entire stack from scratch in <2 hours

**Incident Response Plan**:
1. Detect (monitoring alerts)
2. Assess (ops team investigates)
3. Contain (stop affected service)
4. Remediate (fix, deploy)
5. Recover (restart service)
6. Post-mortem (document learnings)

---

## 8. MVP Tech Stack (Cost-Optimized)

### Frontend
- **Framework**: Next.js (✅ Implemented)
- **Hosting**: Vercel free tier or AWS ECS (£10-50/month)
- **CDN**: Cloudflare free tier
- **Cost**: £0-50/month

### Backend
- **Language**: Go (✅ Current) or Node.js
- **Hosting**: AWS ECS Fargate (£50-200/month)
- **Load Balancer**: AWS ALB (£20/month)
- **Cost**: £70-220/month

### Database
- **Type**: PostgreSQL (✅ Current: RDS)
- **Hosting**: AWS RDS (£50-150/month for small instance)
- **Backups**: Automated (included)
- **Cost**: £50-150/month

### Liquidity Provider
- **Start with**: ONE provider (Binance or Kraken)
- **Model**: Revenue share or per-trade fee
- **Cost**: £0 upfront (pay per trade)

### KYC/AML
- **Provider**: Sumsub or Onfido
- **Model**: Pay per verification
- **Cost**: £1-3 per KYC check (£100-300/month for 100-300 users)

### Custody/Wallets
- **MVP**: Provider omnibus wallets
- **Later**: Fireblocks/BitGo (£10k-50k/year)
- **Cost**: £0-1000/month (revenue share with provider)

### Payments (Fiat Rails)
- **GBP Deposits**: Modulr or ClearBank
- **Setup**: £1k-5k one-time
- **Ongoing**: £200-500/month
- **Alternative**: Transak/MoonPay (3-5% per transaction, no setup fee)

### Monitoring & Tools
- **Logging**: CloudWatch Logs (£20-50/month)
- **Error Tracking**: Sentry free tier → £26/month
- **Monitoring**: Grafana OSS (free, self-hosted)
- **Cost**: £0-76/month

### **Total MVP Monthly Cost**: £320-£1,100/month

### **Total MVP Setup Cost**: £1,500-£6,000
- Domain + hosting: £200
- Initial dev tools: £300
- KYC provider setup: £500-1,000
- Payment provider setup: £1,000-3,000
- Legal (T&Cs, privacy policy): £500-1,500
- **Can code yourself**: Saves £10k-50k in dev costs

---

## 9. Implementation Phases

### Phase 1: MVP (Months 1-2)
**Goal**: Launch with basic trading functionality

**Features**:
- User registration + basic KYC (Tier 1)
- GBP deposits (one method: bank transfer)
- Market orders only (BTC, ETH, BNB vs GBP)
- Manual withdrawal approvals
- Basic admin console

**Providers**:
- 1 liquidity provider (Binance or Kraken)
- Sumsub/Onfido for KYC
- Email notifications only

**Metrics**:
- Handle 100-500 users
- Process £100k-500k/month volume
- Break-even at ~£50k volume/month (with 0.2% net fee margin)

---

### Phase 2: Growth (Months 3-6)
**Goal**: Scale to 1,000+ users

**Features**:
- Advanced KYC (Tier 2 with photo ID)
- Multiple deposit methods (card via Transak)
- Limit orders
- Automated withdrawal processing
- More cryptocurrencies (10-20 assets)
- Mobile PWA

**Providers**:
- 2-3 liquidity providers (redundancy + better pricing)
- AML screening (Chainalysis)
- SMS notifications (Twilio)

**Metrics**:
- 1,000-5,000 users
- £1M-5M/month volume
- Profitable at £1M+/month volume

---

### Phase 3: Scale (Months 7-12)
**Goal**: Become a leading UK exchange

**Features**:
- Enhanced KYC (Tier 3 for high-net-worth)
- Crypto-to-crypto trading
- Staking and DeFi integration
- Advanced order types (stop-loss, OCO)
- Native mobile apps
- API for developers

**Providers**:
- 5+ liquidity providers + OTC desk
- Fireblocks/BitGo custody (move from omnibus)
- Direct bank integration (not third-party)

**Metrics**:
- 10,000+ users
- £10M-50M/month volume
- 5-10 employees
- Series A funding or cash-flow positive

---

## 10. Comparison: Current vs Broker Model

### Your Current Implementation

**Model**: Direct exchange with own matching engine
**Components**: 
- ✅ Matching engine built
- ✅ Own order book
- ✅ Microservices (Go)
- ✅ Full stack operational

**Pros**:
- Full control of execution
- No provider dependencies
- Better margins (no revenue share)
- More professional

**Cons**:
- Requires capital for liquidity
- More complex to operate
- Higher regulatory burden

---

### Broker Model (This Document)

**Model**: Route orders to external providers
**Components**:
- Execution adapters for providers
- No matching engine needed
- Simpler infrastructure

**Pros**:
- Lower capital requirements
- Faster to market
- Simpler operations
- Provider handles liquidity

**Cons**:
- Dependent on providers
- Revenue share cuts margins
- Less control
- Provider risk

---

## 11. Regulatory Compliance (UK-Specific)

### FCA Registration

**Requirements**:
- Registered with FCA as cryptoasset business
- AML/CTF controls in place
- KYC procedures documented
- Record keeping for 6 years
- Annual audits
- Compliance officer appointed

**Process**:
1. Prepare application (3-6 months)
2. Submit to FCA with £5,000-10,000 fee
3. Wait for review (6-12 months)
4. Receive registration or rejection

**Current Status**: ✅ FCA registration mentioned on site

---

### GDPR Compliance

**Requirements**:
- Privacy policy published ✅
- User consent for data collection
- Right to access data (user can export)
- Right to deletion (close account)
- Data breach notification (72 hours)
- DPO (Data Protection Officer) appointed

---

### Financial Promotions

**Rules**:
- Clear risk warnings on all marketing
- "Capital at risk" disclosure
- No misleading claims
- Past performance warnings

**Current Status**: ✅ Risk warnings present

---

## 12. Cost Breakdown & Economics

### Revenue Model

**Trading Fees**:
- You charge: 0.15% taker, 0.10% maker
- Provider charges: 0.10% taker, 0.08% maker
- **Your margin**: 0.05% taker, 0.02% maker

**Example**:
- User trades £10,000
- You charge: £15 (0.15%)
- Provider charges: £10 (0.10%)
- **Your profit**: £5 per £10k trade

**Monthly Revenue (1,000 active users, £500 average trade)**:
- Trades: 1,000 users × 10 trades/month = 10,000 trades
- Volume: 10,000 × £500 = £5M/month
- Fee revenue: £5M × 0.05% average = **£2,500/month**

### Monthly Costs

| Item | Cost |
|------|------|
| AWS hosting (frontend + backend) | £200 |
| Database (RDS) | £100 |
| KYC verifications (300 users) | £600 |
| Payment provider | £300 |
| Monitoring & tools | £100 |
| Domain & SSL | £10 |
| **Total** | **£1,310/month** |

**Break-even**: ~£2.6M/month trading volume

---

## 13. Implementation Checklist

### Week 1-2: Foundation
- [ ] Set up AWS infrastructure (VPC, subnets, RDS)
- [ ] Deploy current backend services
- [ ] Integrate ONE liquidity provider (sandbox)
- [ ] Set up Sumsub/Onfido sandbox for KYC
- [ ] Create admin console (basic)

### Week 3-4: Core Features
- [ ] Implement Order Router with provider adapter
- [ ] Build ledger reservation system
- [ ] Connect payment provider (Transak or Modulr)
- [ ] Set up email notifications
- [ ] Test end-to-end flow (deposit → trade → withdraw)

### Week 5-6: Polish & Security
- [ ] Add 2FA enforcement
- [ ] Implement withdrawal limits
- [ ] Set up reconciliation jobs
- [ ] Security audit (external)
- [ ] Pen test critical flows
- [ ] Legal review (T&Cs, privacy)

### Week 7-8: Launch Prep
- [ ] Beta testing with 10-20 users
- [ ] Fix bugs and edge cases
- [ ] Set up monitoring dashboards
- [ ] Create incident response runbooks
- [ ] Soft launch (invite-only)
- [ ] Marketing materials

### Week 9+: Public Launch
- [ ] Open registration
- [ ] PR and marketing
- [ ] Customer support training
- [ ] Scale infrastructure as needed
- [ ] Iterate based on feedback

---

## 14. Risk Management

### Operational Risks

**Provider Downtime**:
- Mitigation: Use 2+ providers
- Fallback: Route to backup provider
- Communication: Status page for users

**Reconciliation Mismatch**:
- Mitigation: Halt withdrawals immediately
- Investigation: Manual review of discrepancy
- Resolution: Correct ledger or chase provider

**Hot Wallet Theft**:
- Mitigation: Limit hot wallet to 5% of total
- Insurance: £100k+ coverage
- Response: Freeze withdrawals, investigate, reimburse users

**Regulatory Action**:
- Mitigation: Full FCA compliance from day one
- Legal: Retain specialist crypto lawyer
- Insurance: Professional indemnity insurance

---

## 15. Summary & Recommendations

### For MVP Launch (Months 1-3)

**Recommended Approach**:
1. ✅ **Keep current architecture** - It's more advanced than broker model
2. **Add**: Provider integrations for additional liquidity
3. **Add**: Reconciliation service enhancements
4. **Focus**: Grow user base to 1,000 users
5. **Capital needed**: £10k-30k (mostly KYC, legal, marketing)

### When to Consider Broker Model

**Broker model makes sense if**:
- You have <£50k capital
- Want to launch in 4-8 weeks
- Don't want to manage liquidity
- Prefer simplicity over margins

**Your current model makes sense if**:
- You have £100k+ capital
- Want better profit margins
- Have technical team
- Want full control (✅ This is you!)

---

## Conclusion

You've already built a **more sophisticated system than the broker model** described in this architecture. Your current implementation has:

✅ Own matching engine
✅ Direct order execution
✅ Comprehensive microservices
✅ Better economics long-term

**Recommendation**: **Keep your current architecture** and focus on:
1. Growing user base (SEO ✅ Complete)
2. Adding liquidity (market makers, API traders)
3. Enhancing security and compliance
4. Scaling infrastructure

The broker model is simpler but less profitable. You're already past that stage!

---

*This guide serves as reference for understanding alternative exchange architectures. Your current implementation is superior for long-term growth.*

**Created**: October 11, 2025
**Status**: Reference Document
**Recommendation**: Continue with current direct exchange model

