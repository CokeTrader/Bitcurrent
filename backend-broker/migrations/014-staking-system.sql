-- Migration: Staking System
-- Passive income through staking

CREATE TABLE IF NOT EXISTS staking_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  term VARCHAR(20) NOT NULL, -- 'flexible', '30d', '90d', '180d', '365d'
  apy_rate DECIMAL(5, 2) NOT NULL, -- Annual percentage yield
  auto_compound BOOLEAN DEFAULT false,
  rewards_earned DECIMAL(20, 8) DEFAULT 0,
  penalty_applied DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  started_at TIMESTAMP NOT NULL,
  matures_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_stake_amount CHECK (amount > 0),
  CONSTRAINT valid_stake_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Staking rewards history
CREATE TABLE IF NOT EXISTS staking_rewards (
  id SERIAL PRIMARY KEY,
  position_id INTEGER NOT NULL REFERENCES staking_positions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  reward_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'compound', 'final'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staking_positions_user ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_status ON staking_positions(status);
CREATE INDEX IF NOT EXISTS idx_staking_positions_asset ON staking_positions(asset);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_position ON staking_rewards(position_id);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_user ON staking_rewards(user_id);

-- View: Active staking summary
CREATE OR REPLACE VIEW active_staking_summary AS
SELECT 
  u.id as user_id,
  u.email,
  sp.asset,
  COUNT(sp.id) as position_count,
  SUM(sp.amount) as total_staked,
  AVG(sp.apy_rate) as avg_apy,
  SUM(sp.rewards_earned) as total_rewards_earned
FROM users u
JOIN staking_positions sp ON u.id = sp.user_id
WHERE sp.status = 'active'
GROUP BY u.id, u.email, sp.asset;

-- Function to distribute daily staking rewards
CREATE OR REPLACE FUNCTION distribute_staking_rewards()
RETURNS void AS $$
DECLARE
  v_position RECORD;
  v_daily_reward DECIMAL(20, 8);
BEGIN
  FOR v_position IN 
    SELECT * FROM staking_positions WHERE status = 'active'
  LOOP
    -- Calculate daily reward
    v_daily_reward := v_position.amount * (v_position.apy_rate / 365 / 100);
    
    -- Record reward
    INSERT INTO staking_rewards (position_id, user_id, asset, amount, reward_type, created_at)
    VALUES (v_position.id, v_position.user_id, v_position.asset, v_daily_reward, 'daily', NOW());
    
    -- Update rewards earned
    UPDATE staking_positions
    SET rewards_earned = rewards_earned + v_daily_reward
    WHERE id = v_position.id;
    
    -- If auto-compound, add to staked amount
    IF v_position.auto_compound THEN
      UPDATE staking_positions
      SET amount = amount + v_daily_reward
      WHERE id = v_position.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE staking_positions IS 'User staking positions for earning passive income';
COMMENT ON TABLE staking_rewards IS 'History of all staking rewards distributed';
COMMENT ON VIEW active_staking_summary IS 'Summary of all active staking positions';
COMMENT ON FUNCTION distribute_staking_rewards IS 'Daily job to distribute staking rewards';

