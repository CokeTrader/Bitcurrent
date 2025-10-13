-- Migration: Advanced Orders Table
-- Support for limit, stop-loss, take-profit, and trailing stop orders

CREATE TABLE IF NOT EXISTS advanced_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'limit', 'stop_loss', 'take_profit', 'trailing_stop', 'oco'
  side VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
  amount DECIMAL(20, 8) NOT NULL, -- Amount in GBP (for buy) or BTC (for sell)
  
  -- Price conditions
  limit_price DECIMAL(20, 2), -- For limit orders
  stop_price DECIMAL(20, 2), -- For stop-loss orders
  take_profit_price DECIMAL(20, 2), -- For take-profit orders
  
  -- Trailing stop specific
  trail_percent DECIMAL(5, 2), -- Trailing percentage
  highest_price DECIMAL(20, 2), -- Track highest price for trailing stop
  
  -- Execution details
  executed_price DECIMAL(20, 2), -- Actual execution price
  executed_at TIMESTAMP, -- When the order was executed
  
  -- Status and metadata
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'executed', 'cancelled', 'failed', 'expired'
  error_message TEXT, -- Store error if execution failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional expiry time for orders
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_side CHECK (side IN ('buy', 'sell')),
  CONSTRAINT valid_type CHECK (type IN ('limit', 'stop_loss', 'take_profit', 'trailing_stop', 'oco')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'executed', 'cancelled', 'failed', 'expired'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advanced_orders_user_id ON advanced_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_status ON advanced_orders(status);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_type ON advanced_orders(type);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_created_at ON advanced_orders(created_at DESC);

-- For monitoring queries (get all pending orders)
CREATE INDEX IF NOT EXISTS idx_advanced_orders_pending ON advanced_orders(status) WHERE status = 'pending';

-- Order execution history view
CREATE OR REPLACE VIEW order_execution_history AS
SELECT 
  ao.id,
  ao.user_id,
  u.email,
  ao.type,
  ao.side,
  ao.amount,
  ao.limit_price,
  ao.stop_price,
  ao.take_profit_price,
  ao.executed_price,
  ao.status,
  ao.created_at,
  ao.executed_at,
  EXTRACT(EPOCH FROM (ao.executed_at - ao.created_at)) as execution_time_seconds
FROM advanced_orders ao
JOIN users u ON ao.user_id = u.id
WHERE ao.status = 'executed'
ORDER BY ao.executed_at DESC;

-- Function to automatically cancel expired orders
CREATE OR REPLACE FUNCTION cancel_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE advanced_orders
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_advanced_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_advanced_orders_timestamp
BEFORE UPDATE ON advanced_orders
FOR EACH ROW
EXECUTE FUNCTION update_advanced_orders_timestamp();

-- Comments for documentation
COMMENT ON TABLE advanced_orders IS 'Stores advanced order types (limit, stop-loss, take-profit, trailing stop)';
COMMENT ON COLUMN advanced_orders.type IS 'Order type: limit, stop_loss, take_profit, trailing_stop, oco';
COMMENT ON COLUMN advanced_orders.side IS 'Buy or sell order';
COMMENT ON COLUMN advanced_orders.amount IS 'Amount in GBP for buy orders, BTC for sell orders';
COMMENT ON COLUMN advanced_orders.limit_price IS 'Target price for limit orders';
COMMENT ON COLUMN advanced_orders.stop_price IS 'Trigger price for stop-loss orders';
COMMENT ON COLUMN advanced_orders.take_profit_price IS 'Target price for take-profit orders';
COMMENT ON COLUMN advanced_orders.trail_percent IS 'Trailing percentage for trailing stop orders';
COMMENT ON COLUMN advanced_orders.highest_price IS 'Highest price reached (for trailing stop)';
COMMENT ON COLUMN advanced_orders.executed_price IS 'Actual price at which order was executed';
COMMENT ON COLUMN advanced_orders.status IS 'Order status: pending, executed, cancelled, failed, expired';

-- Sample data for testing (commented out)
-- INSERT INTO advanced_orders (user_id, type, side, amount, limit_price, status)
-- VALUES (1, 'limit', 'buy', 100, 35000, 'pending');

