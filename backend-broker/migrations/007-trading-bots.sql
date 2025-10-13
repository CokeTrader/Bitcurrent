-- Migration: Trading Bots System
-- Automated trading strategies

CREATE TABLE IF NOT EXISTS trading_bots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'dca', 'grid', 'rsi', 'macd', 'custom'
  asset VARCHAR(10) NOT NULL, -- 'BTC', 'ETH', etc.
  config JSONB NOT NULL, -- Bot-specific configuration
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'stopped'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_bot_type CHECK (type IN ('dca', 'grid', 'rsi', 'macd', 'custom')),
  CONSTRAINT valid_bot_status CHECK (status IN ('active', 'paused', 'stopped'))
);

-- Bot executions history
CREATE TABLE IF NOT EXISTS bot_executions (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER NOT NULL REFERENCES trading_bots(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  total_value DECIMAL(20, 2) GENERATED ALWAYS AS (amount * price) STORED,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_execution_type CHECK (type IN ('buy', 'sell')),
  CONSTRAINT valid_execution_status CHECK (status IN ('success', 'failed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trading_bots_user_id ON trading_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_status ON trading_bots(status);
CREATE INDEX IF NOT EXISTS idx_trading_bots_type ON trading_bots(type);
CREATE INDEX IF NOT EXISTS idx_bot_executions_bot_id ON bot_executions(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_executions_created_at ON bot_executions(created_at DESC);

-- View: Bot performance summary
CREATE OR REPLACE VIEW bot_performance AS
SELECT 
  tb.id as bot_id,
  tb.user_id,
  tb.name,
  tb.type,
  tb.asset,
  tb.status,
  COUNT(be.id) as total_executions,
  COUNT(CASE WHEN be.status = 'success' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN be.status = 'failed' THEN 1 END) as failed_executions,
  SUM(CASE WHEN be.type = 'buy' THEN be.amount ELSE 0 END) as total_bought,
  SUM(CASE WHEN be.type = 'sell' THEN be.amount ELSE 0 END) as total_sold,
  AVG(CASE WHEN be.type = 'buy' THEN be.price END) as avg_buy_price,
  AVG(CASE WHEN be.type = 'sell' THEN be.price END) as avg_sell_price,
  MAX(be.created_at) as last_execution,
  tb.created_at as bot_created
FROM trading_bots tb
LEFT JOIN bot_executions be ON tb.id = be.bot_id
GROUP BY tb.id, tb.user_id, tb.name, tb.type, tb.asset, tb.status, tb.created_at;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bot_timestamp
BEFORE UPDATE ON trading_bots
FOR EACH ROW
EXECUTE FUNCTION update_bot_timestamp();

-- Comments
COMMENT ON TABLE trading_bots IS 'Automated trading bots configured by users';
COMMENT ON TABLE bot_executions IS 'History of all bot trade executions';
COMMENT ON COLUMN trading_bots.type IS 'Bot strategy type: DCA, grid, RSI, MACD, custom';
COMMENT ON COLUMN trading_bots.config IS 'JSON configuration specific to bot type';
COMMENT ON COLUMN trading_bots.status IS 'Bot status: active (running), paused, stopped';
COMMENT ON VIEW bot_performance IS 'Aggregated view of bot execution statistics';

-- Sample DCA bot configuration:
-- {
--   "amount": 100,
--   "intervalHours": 24,
--   "lastExecuted": "2025-01-01T00:00:00Z",
--   "executionCount": 10
-- }

-- Sample Grid bot configuration:
-- {
--   "lowerPrice": 35000,
--   "upperPrice": 45000,
--   "gridLevels": 10,
--   "totalAmount": 1000,
--   "amountPerGrid": 100,
--   "orders": []
-- }

-- Sample RSI bot configuration:
-- {
--   "buyRSI": 30,
--   "sellRSI": 70,
--   "tradeAmount": 50,
--   "rsiPeriod": 14
-- }

