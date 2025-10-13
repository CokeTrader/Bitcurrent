-- Migration: Crypto Lending & Borrowing

CREATE TABLE IF NOT EXISTS lending_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  duration_days INTEGER NOT NULL,
  apr DECIMAL(5, 2) NOT NULL,
  interest_earned DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL,
  matures_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS borrowing_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collateral_asset VARCHAR(10) NOT NULL,
  collateral_amount DECIMAL(20, 8) NOT NULL,
  borrow_asset VARCHAR(10) NOT NULL,
  borrow_amount DECIMAL(20, 8) NOT NULL,
  apr DECIMAL(5, 2) NOT NULL,
  interest_owed DECIMAL(20, 8) DEFAULT 0,
  liquidation_price DECIMAL(20, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  due_at TIMESTAMP NOT NULL,
  repaid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lending_positions_user ON lending_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_positions_user ON borrowing_positions(user_id);

