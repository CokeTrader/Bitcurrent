-- Migration: Real Bitcoin Trading Tables
-- Add support for GBP/BTC balances and complete trading flow

-- Add balance columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gbp_balance DECIMAL(20, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS btc_balance DECIMAL(20, 8) DEFAULT 0.00000000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0;

-- Add PnL column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS pnl DECIMAL(20, 2) DEFAULT 0.00;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exchange VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS external_order_id VARCHAR(255);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset VARCHAR(10) NOT NULL, -- 'BTC', 'GBP', etc.
  amount DECIMAL(20, 8) NOT NULL,
  address TEXT, -- For crypto withdrawals
  bank_details JSONB, -- For fiat withdrawals
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  external_id VARCHAR(255), -- Exchange reference ID
  network_fee DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create deposits table (if not exists)
CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount DECIMAL(20, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
  payment_method VARCHAR(50), -- 'stripe', 'bank_transfer', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  external_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT positive_deposit_amount CHECK (amount > 0)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_trades_exchange ON trades(exchange);
CREATE INDEX IF NOT EXISTS idx_trades_external_order_id ON trades(external_order_id);

-- Create trigger to update balance on completed deposits
CREATE OR REPLACE FUNCTION update_balance_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE users
    SET gbp_balance = gbp_balance + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance_on_deposit
AFTER UPDATE ON deposits
FOR EACH ROW
EXECUTE FUNCTION update_balance_on_deposit();

COMMENT ON TABLE withdrawals IS 'Tracks all cryptocurrency and fiat withdrawals';
COMMENT ON TABLE deposits IS 'Tracks all fiat deposits';
COMMENT ON COLUMN users.gbp_balance IS 'User GBP balance for trading';
COMMENT ON COLUMN users.btc_balance IS 'User Bitcoin balance';
COMMENT ON COLUMN users.kyc_verified IS 'Whether user has completed KYC verification';
COMMENT ON COLUMN users.kyc_level IS 'KYC verification level (0=none, 1=basic, 2=enhanced)';
COMMENT ON COLUMN trades.pnl IS 'Profit/Loss for the trade in GBP';
COMMENT ON COLUMN trades.exchange IS 'Exchange where trade was executed (coinbase, kraken, etc.)';
COMMENT ON COLUMN trades.external_order_id IS 'Order ID from external exchange';

