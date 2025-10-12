-- Create paper_trading_accounts table
CREATE TABLE IF NOT EXISTS paper_trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    initial_balance NUMERIC(20, 2) NOT NULL CHECK (initial_balance >= 100 AND initial_balance <= 100000),
    current_balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    reset_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_paper_accounts_user_id ON paper_trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_accounts_active ON paper_trading_accounts(user_id, is_active) WHERE is_active = TRUE;

-- Add constraint: max 2 active accounts per user (enforced in application logic)
COMMENT ON TABLE paper_trading_accounts IS 'Paper trading accounts - users can have up to 2 active accounts';

