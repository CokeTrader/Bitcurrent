-- BitCurrent Exchange - Add Banking Tables
-- Migration: 000004_add_banking_tables

-- Bank accounts table (verified user bank accounts)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    sort_code VARCHAR(8) NOT NULL,
    account_number VARCHAR(8) NOT NULL,
    iban VARCHAR(34),
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- 'open_banking', 'manual', 'micro_deposit'
    verified_at TIMESTAMPTZ,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bank_accounts_user_account UNIQUE (user_id, sort_code, account_number)
);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_verified ON bank_accounts(verified);

-- Payment transactions (reconciliation tracking)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE NOT NULL, -- Bank's transaction ID
    provider VARCHAR(50) NOT NULL, -- 'clearbank', 'modulr', 'truelayer'
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    reference VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    account_id UUID REFERENCES accounts(id),
    deposit_id UUID REFERENCES deposits(id),
    withdrawal_id UUID REFERENCES withdrawals(id),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    CONSTRAINT payment_transactions_direction_check CHECK (direction IN ('inbound', 'outbound'))
);

CREATE INDEX idx_payment_tx_external_id ON payment_transactions(external_id);
CREATE INDEX idx_payment_tx_provider ON payment_transactions(provider);
CREATE INDEX idx_payment_tx_status ON payment_transactions(status);
CREATE INDEX idx_payment_tx_deposit ON payment_transactions(deposit_id);
CREATE INDEX idx_payment_tx_withdrawal ON payment_transactions(withdrawal_id);
CREATE INDEX idx_payment_tx_created ON payment_transactions(created_at DESC);

-- Webhook events (for idempotency and audit)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) UNIQUE, -- Provider's event ID
    payload JSONB NOT NULL,
    signature VARCHAR(500),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- Open Banking connections
CREATE TABLE IF NOT EXISTS open_banking_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'truelayer'
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    consent_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_ob_connections_user_id ON open_banking_connections(user_id);
CREATE INDEX idx_ob_connections_provider ON open_banking_connections(provider);
CREATE INDEX idx_ob_connections_status ON open_banking_connections(status);

-- Payment reconciliation reports
CREATE TABLE IF NOT EXISTS payment_reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    matched_count INT DEFAULT 0,
    unmatched_count INT DEFAULT 0,
    total_amount DECIMAL(18, 2),
    issues JSONB,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_recon_reports_unique UNIQUE (report_date, provider)
);

CREATE INDEX idx_payment_recon_date ON payment_reconciliation_reports(report_date DESC);
CREATE INDEX idx_payment_recon_provider ON payment_reconciliation_reports(provider);

-- Add triggers for updated_at
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ob_connections_updated_at BEFORE UPDATE ON open_banking_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE bank_accounts IS 'Verified user bank accounts for GBP deposits/withdrawals';
COMMENT ON TABLE payment_transactions IS 'All payment transactions for reconciliation';
COMMENT ON TABLE webhook_events IS 'Incoming webhooks from payment providers';
COMMENT ON TABLE open_banking_connections IS 'Open Banking OAuth connections';
COMMENT ON TABLE payment_reconciliation_reports IS 'Daily payment reconciliation reports';



