-- Advanced Trading Tables

CREATE TABLE IF NOT EXISTS liquidity_pools (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset1 VARCHAR(10) NOT NULL,
  amount1 DECIMAL(20, 8) NOT NULL,
  asset2 VARCHAR(10) NOT NULL,
  amount2 DECIMAL(20, 8) NOT NULL,
  share DECIMAL(10, 6) DEFAULT 0,
  fees_earned DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  withdrawn_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS futures_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset VARCHAR(10) NOT NULL,
  contracts DECIMAL(20, 2) NOT NULL,
  leverage INTEGER NOT NULL,
  side VARCHAR(10) NOT NULL,
  entry_price DECIMAL(20, 2) NOT NULL,
  exit_price DECIMAL(20, 2),
  margin DECIMAL(20, 2) NOT NULL,
  pnl DECIMAL(20, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS options_contracts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset VARCHAR(10) NOT NULL,
  strike_price DECIMAL(20, 2) NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  option_type VARCHAR(10) NOT NULL,
  premium DECIMAL(20, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_liquidity_pools_user ON liquidity_pools(user_id);
CREATE INDEX idx_futures_positions_user ON futures_positions(user_id);
CREATE INDEX idx_options_contracts_user ON options_contracts(user_id);

