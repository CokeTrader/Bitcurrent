-- Migration: Referral Program & Rewards
-- Viral growth features

-- Add referral fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  CONSTRAINT unique_referral UNIQUE (referred_id),
  CONSTRAINT valid_referral_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'referral_bonus', 'signup_bonus', 'loyalty_points', 'trade_cashback'
  amount DECIMAL(20, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_reward CHECK (amount > 0)
);

-- Loyalty points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tier VARCHAR(20) NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_loyalty UNIQUE (user_id),
  CONSTRAINT valid_tier CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);

-- View: Referral leaderboard
CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT 
  u.id as user_id,
  u.username,
  u.referral_code,
  COUNT(r.id) FILTER (WHERE r.status = 'completed') as total_referrals,
  SUM(CASE WHEN r.status = 'completed' THEN 10.00 ELSE 0 END) as total_earned
FROM users u
LEFT JOIN referrals r ON u.id = r.referrer_id
GROUP BY u.id, u.username, u.referral_code
HAVING COUNT(r.id) FILTER (WHERE r.status = 'completed') > 0
ORDER BY total_referrals DESC;

-- Function to award loyalty points
CREATE OR REPLACE FUNCTION award_loyalty_points(p_user_id INTEGER, p_points INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO loyalty_points (user_id, points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) DO UPDATE
  SET points = loyalty_points.points + p_points,
      updated_at = NOW();
      
  -- Update tier based on points
  UPDATE loyalty_points
  SET tier = CASE 
    WHEN points >= 10000 THEN 'platinum'
    WHEN points >= 5000 THEN 'gold'
    WHEN points >= 1000 THEN 'silver'
    ELSE 'bronze'
  END
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points on trade
CREATE OR REPLACE FUNCTION award_points_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 1 point per £1 traded
  PERFORM award_loyalty_points(NEW.user_id, FLOOR(NEW.total)::INTEGER);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_points_on_trade
AFTER INSERT ON trades
FOR EACH ROW
EXECUTE FUNCTION award_points_on_trade();

-- Comments
COMMENT ON TABLE referrals IS 'Track all user referrals';
COMMENT ON TABLE rewards IS 'Track all rewards given to users';
COMMENT ON TABLE loyalty_points IS 'User loyalty program points and tiers';

