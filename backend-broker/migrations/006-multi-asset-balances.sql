-- Migration: Multi-Asset Balance Support
-- Add balance columns for ETH, SOL, ADA, DOT, and other cryptocurrencies

-- Add balance columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS eth_balance DECIMAL(20, 8) DEFAULT 0.00000000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sol_balance DECIMAL(20, 8) DEFAULT 0.00000000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ada_balance DECIMAL(20, 6) DEFAULT 0.000000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dot_balance DECIMAL(20, 8) DEFAULT 0.00000000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ltc_balance DECIMAL(20, 8) DEFAULT 0.00000000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xrp_balance DECIMAL(20, 6) DEFAULT 0.000000;

-- Add constraints to ensure non-negative balances
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS eth_balance_non_negative CHECK (eth_balance >= 0);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS sol_balance_non_negative CHECK (sol_balance >= 0);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS ada_balance_non_negative CHECK (ada_balance >= 0);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS dot_balance_non_negative CHECK (dot_balance >= 0);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS ltc_balance_non_negative CHECK (ltc_balance >= 0);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS xrp_balance_non_negative CHECK (xrp_balance >= 0);

-- Create index for efficient balance queries
CREATE INDEX IF NOT EXISTS idx_users_asset_balances ON users(id, eth_balance, sol_balance, ada_balance, dot_balance);

-- Create view for user portfolios
CREATE OR REPLACE VIEW user_portfolios AS
SELECT 
  u.id as user_id,
  u.email,
  u.gbp_balance,
  u.btc_balance,
  u.eth_balance,
  u.sol_balance,
  u.ada_balance,
  u.dot_balance,
  u.ltc_balance,
  u.xrp_balance,
  COUNT(DISTINCT t.symbol) as assets_traded,
  SUM(CASE WHEN t.side = 'buy' THEN t.total ELSE 0 END) as total_bought_gbp,
  SUM(CASE WHEN t.side = 'sell' THEN t.total ELSE 0 END) as total_sold_gbp,
  SUM(t.pnl) as total_pnl
FROM users u
LEFT JOIN trades t ON u.id = t.user_id
GROUP BY u.id, u.email, u.gbp_balance, u.btc_balance, u.eth_balance, u.sol_balance, u.ada_balance, u.dot_balance, u.ltc_balance, u.xrp_balance;

-- Function to get user's total portfolio value (requires price inputs)
CREATE OR REPLACE FUNCTION calculate_portfolio_value(
  p_user_id INTEGER,
  p_btc_price DECIMAL DEFAULT 40000,
  p_eth_price DECIMAL DEFAULT 2500,
  p_sol_price DECIMAL DEFAULT 100,
  p_ada_price DECIMAL DEFAULT 0.5,
  p_dot_price DECIMAL DEFAULT 7.5,
  p_ltc_price DECIMAL DEFAULT 70,
  p_xrp_price DECIMAL DEFAULT 0.6
)
RETURNS TABLE(
  user_id INTEGER,
  gbp_balance DECIMAL,
  btc_value DECIMAL,
  eth_value DECIMAL,
  sol_value DECIMAL,
  ada_value DECIMAL,
  dot_value DECIMAL,
  ltc_value DECIMAL,
  xrp_value DECIMAL,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.gbp_balance,
    (u.btc_balance * p_btc_price),
    (u.eth_balance * p_eth_price),
    (u.sol_balance * p_sol_price),
    (u.ada_balance * p_ada_price),
    (u.dot_balance * p_dot_price),
    (u.ltc_balance * p_ltc_price),
    (u.xrp_balance * p_xrp_price),
    (u.gbp_balance + 
     u.btc_balance * p_btc_price + 
     u.eth_balance * p_eth_price + 
     u.sol_balance * p_sol_price +
     u.ada_balance * p_ada_price +
     u.dot_balance * p_dot_price +
     u.ltc_balance * p_ltc_price +
     u.xrp_balance * p_xrp_price)
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON COLUMN users.eth_balance IS 'User Ethereum balance (8 decimals)';
COMMENT ON COLUMN users.sol_balance IS 'User Solana balance (8 decimals)';
COMMENT ON COLUMN users.ada_balance IS 'User Cardano balance (6 decimals)';
COMMENT ON COLUMN users.dot_balance IS 'User Polkadot balance (8 decimals)';
COMMENT ON COLUMN users.ltc_balance IS 'User Litecoin balance (8 decimals)';
COMMENT ON COLUMN users.xrp_balance IS 'User Ripple balance (6 decimals)';

COMMENT ON VIEW user_portfolios IS 'Aggregated view of user portfolios with trading statistics';
COMMENT ON FUNCTION calculate_portfolio_value IS 'Calculate total portfolio value in GBP for a user given current crypto prices';

-- Example query to get top 10 users by portfolio value (using sample prices)
-- SELECT * FROM calculate_portfolio_value(1) ORDER BY total_value DESC LIMIT 10;

