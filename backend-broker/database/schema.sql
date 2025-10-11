-- BitCurrent Exchange - Simplified Broker Model Database Schema
-- Minimum viable schema for £1k budget MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'GB',
    kyc_status INT DEFAULT 0, -- 0=none, 1=basic_submitted, 2=verified, 3=rejected
    kyc_rejection_reason TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CLOSED
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);

-- 2. Accounts Table (one per user per currency)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL, -- GBP, BTC, ETH, etc.
    balance NUMERIC(20, 8) DEFAULT 0 CHECK (balance >= 0),
    available NUMERIC(20, 8) DEFAULT 0 CHECK (available >= 0), -- balance - reserved
    reserved NUMERIC(20, 8) DEFAULT 0 CHECK (reserved >= 0), -- locked in pending orders
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, currency),
    CONSTRAINT check_balance CHECK (balance = available + reserved)
);

-- Index for faster balance queries
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_currency ON accounts(currency);

-- 3. Orders Table (user trading orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL, -- 'BTC-GBP', 'ETH-GBP'
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    type VARCHAR(10) DEFAULT 'MARKET', -- MARKET only for MVP
    amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0), -- Amount in base currency
    quote_amount NUMERIC(20, 8), -- Amount in quote currency (GBP)
    price NUMERIC(20, 8), -- NULL for market orders
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, FILLED, FAILED, CANCELLED
    provider VARCHAR(50) DEFAULT 'binance',
    provider_order_id VARCHAR(100),
    filled_amount NUMERIC(20, 8) DEFAULT 0,
    average_price NUMERIC(20, 8),
    fee NUMERIC(20, 8) DEFAULT 0,
    fee_currency VARCHAR(10),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    filled_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Indexes for order queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 4. Transactions Table (immutable ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- DEPOSIT, TRADE, WITHDRAWAL, FEE, CREDIT, DEBIT
    amount NUMERIC(20, 8) NOT NULL,
    balance_before NUMERIC(20, 8) NOT NULL,
    balance_after NUMERIC(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    reference_type VARCHAR(50), -- ORDER, DEPOSIT, WITHDRAWAL
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for transaction history
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

-- 5. Deposits Table (manual tracking initially)
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
    bank_reference VARCHAR(100), -- User's unique reference code
    payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- bank_transfer, card, crypto
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CREDITED
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    credited_at TIMESTAMP
);

-- Indexes for deposit management
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_bank_reference ON deposits(bank_reference);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);

-- 6. Withdrawals Table (manual approval initially)
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
    destination VARCHAR(255) NOT NULL, -- Bank account or crypto address
    destination_type VARCHAR(20) NOT NULL, -- BANK, CRYPTO
    bank_account_name VARCHAR(255),
    bank_sort_code VARCHAR(10),
    bank_account_number VARCHAR(20),
    crypto_address VARCHAR(255),
    crypto_network VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED
    approved_by UUID REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    provider_tx_id VARCHAR(255), -- Binance withdrawal ID or bank reference
    transaction_id UUID REFERENCES transactions(id),
    fee NUMERIC(20, 8) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for withdrawal management
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- 7. Admin Logs (audit trail)
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- USER, DEPOSIT, WITHDRAWAL, ORDER
    resource_id UUID NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_resource ON admin_logs(resource_type, resource_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- 8. System Settings (for dynamic configuration)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('trading_enabled', 'true', 'Enable/disable trading'),
('deposits_enabled', 'true', 'Enable/disable deposits'),
('withdrawals_enabled', 'true', 'Enable/disable withdrawals'),
('min_deposit_gbp', '10', 'Minimum GBP deposit'),
('min_withdrawal_gbp', '10', 'Minimum GBP withdrawal'),
('withdrawal_fee_gbp', '0', 'GBP withdrawal fee'),
('trading_fee_percent', '0.1', 'Trading fee percentage'),
('max_withdrawal_no_approval', '1000', 'Max withdrawal without manual approval')
ON CONFLICT (key) DO NOTHING;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create initial accounts when user is created
CREATE OR REPLACE FUNCTION create_user_accounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Create GBP account
    INSERT INTO accounts (user_id, currency, balance, available, reserved)
    VALUES (NEW.id, 'GBP', 0, 0, 0);
    
    -- Create BTC account
    INSERT INTO accounts (user_id, currency, balance, available, reserved)
    VALUES (NEW.id, 'BTC', 0, 0, 0);
    
    -- Create ETH account
    INSERT INTO accounts (user_id, currency, balance, available, reserved)
    VALUES (NEW.id, 'ETH', 0, 0, 0);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create accounts for new users
CREATE TRIGGER create_accounts_for_new_user
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_accounts();

-- Grant permissions (Railway will use the default user)
-- These will run automatically when connected as the owner

COMMENT ON TABLE users IS 'User accounts and basic profile information';
COMMENT ON TABLE accounts IS 'User currency balances (one row per user per currency)';
COMMENT ON TABLE orders IS 'Trading orders placed by users';
COMMENT ON TABLE transactions IS 'Immutable transaction ledger (audit trail)';
COMMENT ON TABLE deposits IS 'Deposit requests and tracking';
COMMENT ON TABLE withdrawals IS 'Withdrawal requests and approvals';
COMMENT ON TABLE admin_logs IS 'Admin action audit trail';
COMMENT ON TABLE settings IS 'System-wide configuration settings';

