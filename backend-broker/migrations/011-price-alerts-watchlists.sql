-- Migration: Price Alerts & Watchlists

CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  target_price DECIMAL(20, 2) NOT NULL,
  condition VARCHAR(10) NOT NULL, -- 'above' or 'below'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'triggered', 'cancelled'
  triggered_at TIMESTAMP,
  triggered_price DECIMAL(20, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_condition CHECK (condition IN ('above', 'below')),
  CONSTRAINT valid_alert_status CHECK (status IN ('active', 'triggered', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  assets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status);
CREATE INDEX IF NOT EXISTS idx_price_alerts_asset ON price_alerts(asset);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

-- Comments
COMMENT ON TABLE price_alerts IS 'User price alert notifications';
COMMENT ON TABLE watchlists IS 'User custom watchlists';

