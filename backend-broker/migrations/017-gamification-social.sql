-- Gamification & Enhanced Social Features

CREATE TABLE IF NOT EXISTS competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  prize_pool DECIMAL(20, 2) NOT NULL,
  rules JSONB,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_participants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  competition_id INTEGER NOT NULL REFERENCES competitions(id),
  score DECIMAL(20, 2) DEFAULT 0,
  rank INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, competition_id)
);

CREATE TABLE IF NOT EXISTS trading_rooms (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_ideas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  asset VARCHAR(10) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  target_price DECIMAL(20, 2),
  reasoning TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_risk_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
  limits JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  requests_limit INTEGER NOT NULL,
  rate_limit INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nft_listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  contract_address VARCHAR(255) NOT NULL,
  token_id VARCHAR(255) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  blockchain VARCHAR(50) NOT NULL,
  buyer_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP
);

CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competition_participants_user ON competition_participants(user_id);
CREATE INDEX idx_trading_rooms_creator ON trading_rooms(creator_id);
CREATE INDEX idx_trade_ideas_user ON trade_ideas(user_id);
CREATE INDEX idx_nft_listings_user ON nft_listings(user_id);
CREATE INDEX idx_api_subscriptions_user ON api_subscriptions(user_id);

