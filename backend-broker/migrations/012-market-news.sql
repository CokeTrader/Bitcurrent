-- Migration: Market News & Research

CREATE TABLE IF NOT EXISTS market_news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  url VARCHAR(1000) NOT NULL UNIQUE,
  source VARCHAR(100),
  category VARCHAR(50), -- 'bitcoin', 'ethereum', 'defi', 'regulation', etc.
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative', NULL))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_market_news_published ON market_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_category ON market_news(category);
CREATE INDEX IF NOT EXISTS idx_market_news_sentiment ON market_news(sentiment);

-- Comments
COMMENT ON TABLE market_news IS 'Aggregated cryptocurrency news articles';

