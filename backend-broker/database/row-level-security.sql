-- Row-Level Security (RLS) Implementation
-- Ensure users can only access their own data

-- Enable RLS on sensitive tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys_enhanced ENABLE ROW LEVEL SECURITY;

-- Create policies for trades table
CREATE POLICY trades_user_isolation ON trades
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for deposits table
CREATE POLICY deposits_user_isolation ON deposits
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for withdrawals table
CREATE POLICY withdrawals_user_isolation ON withdrawals
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for advanced_orders table
CREATE POLICY advanced_orders_user_isolation ON advanced_orders
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for trading_bots table
CREATE POLICY trading_bots_user_isolation ON trading_bots
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for price_alerts table
CREATE POLICY price_alerts_user_isolation ON price_alerts
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for watchlists table
CREATE POLICY watchlists_user_isolation ON watchlists
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for referrals table (users can see their referrals)
CREATE POLICY referrals_referrer_access ON referrals
  FOR SELECT
  USING (referrer_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY referrals_referred_access ON referrals
  FOR SELECT
  USING (referred_id = current_setting('app.current_user_id')::INTEGER);

-- Create policies for API keys
CREATE POLICY api_keys_user_isolation ON api_keys_enhanced
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Admin override policy (for admin users)
CREATE POLICY admin_full_access ON trades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::INTEGER 
      AND role = 'admin'
    )
  );

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user(p_user_id INTEGER)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON POLICY trades_user_isolation ON trades IS 'Users can only access their own trades';
COMMENT ON POLICY deposits_user_isolation ON deposits IS 'Users can only access their own deposits';
COMMENT ON POLICY withdrawals_user_isolation ON withdrawals IS 'Users can only access their own withdrawals';
COMMENT ON FUNCTION set_current_user IS 'Set user context for RLS policies';

