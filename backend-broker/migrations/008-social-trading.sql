-- Migration: Social Trading & Copy Trading
-- Follow traders, copy their trades, leaderboards

-- Add username to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT false;

-- Social follows table
CREATE TABLE IF NOT EXISTS social_follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT no_self_follow CHECK (follower_id != followed_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, followed_id)
);

-- Copy trading configuration
CREATE TABLE IF NOT EXISTS copy_trading (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  copy_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00, -- % of original trade size
  max_amount_per_trade DECIMAL(20, 2), -- Max GBP per trade
  stop_loss DECIMAL(5, 2), -- % stop loss
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_percentage CHECK (copy_percentage > 0 AND copy_percentage <= 100),
  CONSTRAINT unique_copy_config UNIQUE (follower_id, trader_id)
);

-- Copy trade history
CREATE TABLE IF NOT EXISTS copy_trade_history (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_trade_id INTEGER REFERENCES trades(id) ON DELETE SET NULL,
  asset VARCHAR(10) NOT NULL,
  side VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_follows_follower ON social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_followed ON social_follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_follower ON copy_trading(follower_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trader ON copy_trading(trader_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_enabled ON copy_trading(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_copy_trade_history_follower ON copy_trade_history(follower_id);
CREATE INDEX IF NOT EXISTS idx_copy_trade_history_trader ON copy_trade_history(trader_id);

-- View: Trader leaderboard
CREATE OR REPLACE VIEW trader_leaderboard AS
SELECT 
  u.id as trader_id,
  u.username,
  u.email,
  COUNT(DISTINCT t.id) as total_trades,
  SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
  SUM(t.pnl) as total_pnl,
  AVG(t.pnl) as avg_pnl,
  MAX(t.pnl) as best_trade,
  COUNT(DISTINCT sf.follower_id) as follower_count,
  COUNT(DISTINCT ct.follower_id) FILTER (WHERE ct.enabled = true) as copy_traders_count
FROM users u
LEFT JOIN trades t ON u.id = t.user_id AND t.side = 'sell'
LEFT JOIN social_follows sf ON u.id = sf.followed_id
LEFT JOIN copy_trading ct ON u.id = ct.trader_id
GROUP BY u.id, u.username, u.email
HAVING COUNT(DISTINCT t.id) >= 5
ORDER BY total_pnl DESC;

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM social_follows WHERE followed_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update copy trading timestamp
CREATE OR REPLACE FUNCTION update_copy_trading_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_copy_trading_timestamp
BEFORE UPDATE ON copy_trading
FOR EACH ROW
EXECUTE FUNCTION update_copy_trading_timestamp();

-- Comments
COMMENT ON TABLE social_follows IS 'User follow relationships';
COMMENT ON TABLE copy_trading IS 'Copy trading configurations';
COMMENT ON TABLE copy_trade_history IS 'History of all copied trades';
COMMENT ON VIEW trader_leaderboard IS 'Ranked list of top traders by PnL';

