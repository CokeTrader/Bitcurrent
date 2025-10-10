-- BitCurrent Exchange - Initial Database Schema
-- Migration: 000001_init_schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    kyc_level SMALLINT DEFAULT 0,
    kyc_status VARCHAR(20) DEFAULT 'pending',
    country_code CHAR(2),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_kyc_level_check CHECK (kyc_level >= 0 AND kyc_level <= 3),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'closed', 'pending'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_kyc_level ON users(kyc_level);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Accounts table (users can have multiple accounts: spot, margin, etc.)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_type VARCHAR(20) NOT NULL DEFAULT 'spot',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounts_type_check CHECK (account_type IN ('spot', 'margin', 'institutional')),
    CONSTRAINT accounts_status_check CHECK (status IN ('active', 'frozen', 'closed'))
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_status ON accounts(status);

-- Wallets table (one per currency per account)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    address VARCHAR(255),
    wallet_type VARCHAR(10) NOT NULL,
    balance DECIMAL(36, 18) DEFAULT 0 NOT NULL,
    available_balance DECIMAL(36, 18) DEFAULT 0 NOT NULL,
    reserved_balance DECIMAL(36, 18) DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wallets_currency_check CHECK (currency ~* '^[A-Z]{3,10}$'),
    CONSTRAINT wallets_type_check CHECK (wallet_type IN ('hot', 'cold', 'fiat')),
    CONSTRAINT wallets_balance_check CHECK (balance >= 0),
    CONSTRAINT wallets_available_check CHECK (available_balance >= 0),
    CONSTRAINT wallets_reserved_check CHECK (reserved_balance >= 0),
    CONSTRAINT wallets_balance_sum_check CHECK (balance = available_balance + reserved_balance),
    UNIQUE(account_id, currency)
);

CREATE INDEX idx_wallets_account_id ON wallets(account_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);
CREATE INDEX idx_wallets_type ON wallets(wallet_type);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(4) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    price DECIMAL(36, 18),
    quantity DECIMAL(36, 18) NOT NULL,
    filled_quantity DECIMAL(36, 18) DEFAULT 0 NOT NULL,
    remaining_quantity DECIMAL(36, 18),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    time_in_force VARCHAR(10) DEFAULT 'GTC',
    post_only BOOLEAN DEFAULT FALSE,
    reduce_only BOOLEAN DEFAULT FALSE,
    client_order_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    sequence_id BIGINT,
    CONSTRAINT orders_side_check CHECK (side IN ('buy', 'sell')),
    CONSTRAINT orders_type_check CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    CONSTRAINT orders_status_check CHECK (status IN ('new', 'partial', 'filled', 'cancelled', 'rejected', 'expired')),
    CONSTRAINT orders_tif_check CHECK (time_in_force IN ('GTC', 'IOC', 'FOK', 'GTD')),
    CONSTRAINT orders_quantity_check CHECK (quantity > 0),
    CONSTRAINT orders_filled_check CHECK (filled_quantity >= 0 AND filled_quantity <= quantity)
);

CREATE INDEX idx_orders_account_id ON orders(account_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_account_symbol ON orders(account_id, symbol);
CREATE INDEX idx_orders_sequence_id ON orders(sequence_id);
CREATE INDEX idx_orders_client_order_id ON orders(client_order_id) WHERE client_order_id IS NOT NULL;

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    buyer_order_id UUID NOT NULL REFERENCES orders(id),
    seller_order_id UUID NOT NULL REFERENCES orders(id),
    buyer_account_id UUID NOT NULL REFERENCES accounts(id),
    seller_account_id UUID NOT NULL REFERENCES accounts(id),
    price DECIMAL(36, 18) NOT NULL,
    quantity DECIMAL(36, 18) NOT NULL,
    buyer_fee DECIMAL(36, 18) DEFAULT 0,
    seller_fee DECIMAL(36, 18) DEFAULT 0,
    buyer_fee_currency VARCHAR(10),
    seller_fee_currency VARCHAR(10),
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sequence_id BIGINT UNIQUE NOT NULL,
    CONSTRAINT trades_quantity_check CHECK (quantity > 0),
    CONSTRAINT trades_price_check CHECK (price > 0),
    CONSTRAINT trades_fees_check CHECK (buyer_fee >= 0 AND seller_fee >= 0)
);

CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_buyer_order ON trades(buyer_order_id);
CREATE INDEX idx_trades_seller_order ON trades(seller_order_id);
CREATE INDEX idx_trades_buyer_account ON trades(buyer_account_id);
CREATE INDEX idx_trades_seller_account ON trades(seller_account_id);
CREATE INDEX idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX idx_trades_sequence_id ON trades(sequence_id);

-- Ledger entries (double-entry accounting)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    balance_after DECIMAL(36, 18) NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(20),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    CONSTRAINT ledger_entry_type_check CHECK (entry_type IN ('deposit', 'withdrawal', 'trade', 'fee', 'transfer', 'adjustment', 'reward'))
);

CREATE INDEX idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX idx_ledger_currency ON ledger_entries(currency);
CREATE INDEX idx_ledger_entry_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_account_currency_created ON ledger_entries(account_id, currency, created_at DESC);
CREATE INDEX idx_ledger_reference ON ledger_entries(reference_type, reference_id);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    address VARCHAR(255),
    txid VARCHAR(255),
    network VARCHAR(50),
    confirmations INT DEFAULT 0,
    required_confirmations INT DEFAULT 6,
    status VARCHAR(20) DEFAULT 'pending',
    credited_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deposits_amount_check CHECK (amount > 0),
    CONSTRAINT deposits_status_check CHECK (status IN ('pending', 'confirmed', 'credited', 'failed'))
);

CREATE INDEX idx_deposits_account_id ON deposits(account_id);
CREATE INDEX idx_deposits_currency ON deposits(currency);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_txid ON deposits(txid);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) DEFAULT 0,
    address VARCHAR(255) NOT NULL,
    network VARCHAR(50),
    txid VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT withdrawals_amount_check CHECK (amount > 0),
    CONSTRAINT withdrawals_fee_check CHECK (fee >= 0),
    CONSTRAINT withdrawals_status_check CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX idx_withdrawals_currency ON withdrawals(currency);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_txid ON withdrawals(txid) WHERE txid IS NOT NULL;
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    ip_whitelist TEXT[],
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT api_keys_status_check CHECK (status IN ('active', 'revoked', 'expired'))
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(status);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_code INT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_ip ON audit_logs(ip_address);

-- KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    provider VARCHAR(50),
    provider_reference VARCHAR(255),
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT kyc_doc_type_check CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'proof_of_address', 'selfie')),
    CONSTRAINT kyc_status_check CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE INDEX idx_kyc_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_status ON kyc_documents(status);
CREATE INDEX idx_kyc_created_at ON kyc_documents(created_at DESC);

-- Trading pairs configuration
CREATE TABLE IF NOT EXISTS trading_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    min_order_size DECIMAL(36, 18) NOT NULL,
    max_order_size DECIMAL(36, 18),
    min_price DECIMAL(36, 18),
    max_price DECIMAL(36, 18),
    price_precision INT DEFAULT 8,
    quantity_precision INT DEFAULT 8,
    maker_fee_bps INT DEFAULT 10,
    taker_fee_bps INT DEFAULT 15,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trading_pairs_status_check CHECK (status IN ('active', 'disabled', 'delisted'))
);

CREATE INDEX idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX idx_trading_pairs_status ON trading_pairs(status);

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_pairs_updated_at BEFORE UPDATE ON trading_pairs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default trading pairs
INSERT INTO trading_pairs (symbol, base_currency, quote_currency, min_order_size, max_order_size, price_precision, quantity_precision, maker_fee_bps, taker_fee_bps, status) VALUES
('BTC-GBP', 'BTC', 'GBP', 0.0001, 100, 2, 8, 10, 15, 'active'),
('ETH-GBP', 'ETH', 'GBP', 0.001, 1000, 2, 8, 10, 15, 'active'),
('SOL-GBP', 'SOL', 'GBP', 0.1, 100000, 2, 8, 10, 15, 'active'),
('MATIC-GBP', 'MATIC', 'GBP', 1, 1000000, 4, 8, 10, 15, 'active'),
('ADA-GBP', 'ADA', 'GBP', 1, 1000000, 4, 8, 10, 15, 'active');

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with KYC information';
COMMENT ON TABLE accounts IS 'Trading accounts (spot, margin, institutional)';
COMMENT ON TABLE wallets IS 'Currency balances for each account';
COMMENT ON TABLE orders IS 'All trading orders';
COMMENT ON TABLE trades IS 'Executed trades';
COMMENT ON TABLE ledger_entries IS 'Complete audit trail of all balance changes';
COMMENT ON TABLE deposits IS 'Cryptocurrency and fiat deposits';
COMMENT ON TABLE withdrawals IS 'Cryptocurrency and fiat withdrawals';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE audit_logs IS 'System audit trail for compliance';
COMMENT ON TABLE kyc_documents IS 'KYC verification documents';
COMMENT ON TABLE trading_pairs IS 'Available trading pairs configuration';



