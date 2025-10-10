-- BitCurrent Exchange - Initial Database Schema
-- Migration: 000001_init_schema
-- Description: Creates core tables for users, accounts, orders, trades, and security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- KYC Status
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'approved', 'rejected')),
    kyc_verified_at TIMESTAMPTZ,
    kyc_tier VARCHAR(20) DEFAULT 'tier1' CHECK (kyc_tier IN ('tier1', 'tier2', 'tier3')),
    
    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    
    -- Indexes
    CONSTRAINT email_lowercase CHECK (email = LOWER(email)),
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);

-- Trading pairs/markets
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,  -- e.g., BTC-GBP
    base_currency VARCHAR(10) NOT NULL,   -- e.g., BTC
    quote_currency VARCHAR(10) NOT NULL,  -- e.g., GBP
    
    -- Trading parameters
    min_order_size DECIMAL(20, 8) NOT NULL,
    max_order_size DECIMAL(20, 8) NOT NULL,
    price_precision INTEGER DEFAULT 2,
    quantity_precision INTEGER DEFAULT 8,
    
    -- Fees
    maker_fee DECIMAL(5, 4) DEFAULT 0.0015,  -- 0.15%
    taker_fee DECIMAL(5, 4) DEFAULT 0.0025,  -- 0.25%
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'halted', 'suspended')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_markets_symbol ON markets(symbol);
CREATE INDEX idx_markets_status ON markets(status);

-- User balances
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    
    -- Balances
    available DECIMAL(20, 8) DEFAULT 0 CHECK (available >= 0),
    locked DECIMAL(20, 8) DEFAULT 0 CHECK (locked >= 0),
    total DECIMAL(20, 8) GENERATED ALWAYS AS (available + locked) STORED,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, currency)
);

CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_balances_currency ON balances(currency);
CREATE INDEX idx_balances_user_currency ON balances(user_id, currency);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id UUID NOT NULL REFERENCES markets(id),
    
    -- Order details
    side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('market', 'limit', 'stop_loss', 'stop_limit')),
    price DECIMAL(20, 8),
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
    filled_quantity DECIMAL(20, 8) DEFAULT 0 CHECK (filled_quantity >= 0),
    remaining_quantity DECIMAL(20, 8) GENERATED ALWAYS AS (quantity - filled_quantity) STORED,
    
    -- Stop orders
    stop_price DECIMAL(20, 8),
    
    -- Execution
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'expired', 'rejected')),
    time_in_force VARCHAR(10) DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK', 'GTD')),
    expires_at TIMESTAMPTZ,
    
    -- Fees
    maker_fee DECIMAL(5, 4),
    taker_fee DECIMAL(5, 4),
    fee_paid DECIMAL(20, 8) DEFAULT 0,
    fee_currency VARCHAR(10),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Client info
    client_order_id VARCHAR(100),
    source VARCHAR(20) DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'api'))
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_market_id ON orders(market_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_market_status ON orders(market_id, status);

-- Trades (matched orders)
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id),
    
    -- Maker/Taker orders
    maker_order_id UUID NOT NULL REFERENCES orders(id),
    taker_order_id UUID NOT NULL REFERENCES orders(id),
    maker_user_id UUID NOT NULL REFERENCES users(id),
    taker_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Trade details
    price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
    side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
    
    -- Fees
    maker_fee DECIMAL(20, 8) DEFAULT 0,
    taker_fee DECIMAL(20, 8) DEFAULT 0,
    
    -- Settlement
    settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    trade_sequence BIGSERIAL
);

CREATE INDEX idx_trades_market_id ON trades(market_id);
CREATE INDEX idx_trades_maker_order_id ON trades(maker_order_id);
CREATE INDEX idx_trades_taker_order_id ON trades(taker_order_id);
CREATE INDEX idx_trades_maker_user_id ON trades(maker_user_id);
CREATE INDEX idx_trades_taker_user_id ON trades(taker_user_id);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_trades_market_created ON trades(market_id, created_at DESC);

-- Deposits
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    
    -- Amount
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    
    -- Type (fiat or crypto)
    type VARCHAR(10) NOT NULL CHECK (type IN ('fiat', 'crypto')),
    
    -- Fiat details
    bank_reference VARCHAR(100),
    bank_account_last4 VARCHAR(4),
    
    -- Crypto details
    txid VARCHAR(255),
    address VARCHAR(255),
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Risk
    aml_checked BOOLEAN DEFAULT FALSE,
    aml_status VARCHAR(20) DEFAULT 'pending',
    risk_score INTEGER
);

CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_txid ON deposits(txid);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);

-- Withdrawals
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    
    -- Amount
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    fee DECIMAL(20, 8) DEFAULT 0,
    net_amount DECIMAL(20, 8) GENERATED ALWAYS AS (amount - fee) STORED,
    
    -- Type
    type VARCHAR(10) NOT NULL CHECK (type IN ('fiat', 'crypto')),
    
    -- Fiat details
    bank_account_id UUID,
    bank_reference VARCHAR(100),
    
    -- Crypto details
    address VARCHAR(255),
    txid VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Risk & Compliance
    aml_checked BOOLEAN DEFAULT FALSE,
    risk_score INTEGER,
    requires_manual_review BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_txid ON withdrawals(txid);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- Wallet addresses (crypto deposit addresses)
CREATE TABLE wallet_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    address VARCHAR(255) UNIQUE NOT NULL,
    
    -- HD wallet derivation
    derivation_path VARCHAR(100),
    address_index INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    UNIQUE(user_id, currency)
);

CREATE INDEX idx_wallet_addresses_user_id ON wallet_addresses(user_id);
CREATE INDEX idx_wallet_addresses_address ON wallet_addresses(address);
CREATE INDEX idx_wallet_addresses_currency ON wallet_addresses(currency);

-- Transactions (ledger entries)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    
    -- Amount (positive for credit, negative for debit)
    amount DECIMAL(20, 8) NOT NULL,
    balance_after DECIMAL(20, 8) NOT NULL,
    
    -- Type
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'deposit', 'withdrawal', 'trade', 'fee', 
        'refund', 'adjustment', 'reward', 'bonus'
    )),
    
    -- Related records
    reference_id UUID,  -- References order, deposit, or withdrawal
    reference_type VARCHAR(20),
    
    -- Description
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id, reference_type);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Key details
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_preview VARCHAR(20) NOT NULL,  -- First few chars for display
    name VARCHAR(100),
    
    -- Permissions
    permissions JSONB DEFAULT '["read"]'::jsonb,
    ip_whitelist TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count BIGINT DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255),
    
    -- Device info
    user_agent TEXT,
    ip_address INET,
    device_id VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_active ON sessions(is_active, expires_at) WHERE is_active = TRUE;

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);

-- KYC Documents
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document details
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'passport', 'drivers_license', 'national_id', 
        'proof_of_address', 'selfie', 'other'
    )),
    document_number VARCHAR(100),
    
    -- Storage
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(255),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Verification
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Expiry
    expires_at DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON kyc_documents(status);

-- Bank accounts (for GBP deposits/withdrawals)
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Account details
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    sort_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(255),
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verification_method VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_verified ON bank_accounts(verified);

-- Market data (OHLCV candles)
CREATE TABLE market_candles (
    id BIGSERIAL PRIMARY KEY,
    market_id UUID NOT NULL REFERENCES markets(id),
    
    -- Timeframe
    interval VARCHAR(10) NOT NULL CHECK (interval IN ('1m', '5m', '15m', '1h', '4h', '1d')),
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- OHLCV
    open DECIMAL(20, 8) NOT NULL,
    high DECIMAL(20, 8) NOT NULL,
    low DECIMAL(20, 8) NOT NULL,
    close DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,
    
    -- Trades
    trade_count INTEGER DEFAULT 0,
    
    UNIQUE(market_id, interval, timestamp)
);

CREATE INDEX idx_market_candles_market_interval ON market_candles(market_id, interval, timestamp DESC);
CREATE INDEX idx_market_candles_timestamp ON market_candles(timestamp DESC);

-- Orderbook snapshots
CREATE TABLE orderbook_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id),
    
    -- Snapshot data
    bids JSONB NOT NULL,  -- [{price, quantity}]
    asks JSONB NOT NULL,  -- [{price, quantity}]
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orderbook_market_timestamp ON orderbook_snapshots(market_id, timestamp DESC);

-- Trading fees (for different tiers)
CREATE TABLE fee_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tier details
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    min_volume DECIMAL(20, 2) DEFAULT 0,
    max_volume DECIMAL(20, 2),
    
    -- Fees
    maker_fee DECIMAL(5, 4) NOT NULL,
    taker_fee DECIMAL(5, 4) NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default fee tiers
INSERT INTO fee_tiers (tier_name, min_volume, max_volume, maker_fee, taker_fee) VALUES
    ('Starter', 0, 10000, 0.0015, 0.0025),
    ('Trader', 10000, 50000, 0.0012, 0.0022),
    ('Pro', 50000, 250000, 0.0010, 0.0020),
    ('VIP', 250000, NULL, 0.0008, 0.0015);

-- User fee overrides (custom fees for specific users)
CREATE TABLE user_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id),  -- NULL for all markets
    
    maker_fee DECIMAL(5, 4) NOT NULL,
    taker_fee DECIMAL(5, 4) NOT NULL,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, market_id)
);

CREATE INDEX idx_user_fees_user_id ON user_fees(user_id);

-- Security events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Details
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    
    -- Action taken
    action_taken TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Channels
    sent_email BOOLEAN DEFAULT FALSE,
    sent_push BOOLEAN DEFAULT FALSE,
    sent_sms BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create initial test markets
INSERT INTO markets (symbol, base_currency, quote_currency, min_order_size, max_order_size, price_precision, quantity_precision)
VALUES 
    ('BTC-GBP', 'BTC', 'GBP', 0.0001, 10.0, 2, 8),
    ('ETH-GBP', 'ETH', 'GBP', 0.001, 100.0, 2, 8),
    ('BTC-USDT', 'BTC', 'USDT', 0.0001, 10.0, 2, 8),
    ('ETH-USDT', 'ETH', 'USDT', 0.001, 100.0, 2, 8);

COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON TABLE markets IS 'Trading pairs/markets';
COMMENT ON TABLE balances IS 'User cryptocurrency and fiat balances';
COMMENT ON TABLE orders IS 'Trading orders';
COMMENT ON TABLE trades IS 'Executed trades (matched orders)';
COMMENT ON TABLE deposits IS 'Deposit transactions';
COMMENT ON TABLE withdrawals IS 'Withdrawal requests';
COMMENT ON TABLE transactions IS 'Double-entry ledger transactions';


