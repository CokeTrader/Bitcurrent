-- Additional Feature Tables

CREATE TABLE IF NOT EXISTS recurring_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  next_execution TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  lesson_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS sar_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_fund_transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  balance DECIMAL(20, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount DECIMAL(20, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recurring_orders_user ON recurring_orders(user_id);
CREATE INDEX idx_recurring_orders_next_exec ON recurring_orders(next_execution);
CREATE INDEX idx_lesson_completions_user ON lesson_completions(user_id);
CREATE INDEX idx_sar_reports_user ON sar_reports(user_id);

