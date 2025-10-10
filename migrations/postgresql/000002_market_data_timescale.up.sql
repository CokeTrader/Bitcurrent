-- BitCurrent Exchange - Market Data TimescaleDB Schema
-- Migration: 000002_market_data_timescale

-- Enable TimescaleDB extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Market data OHLCV table
CREATE TABLE IF NOT EXISTS market_data (
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(36, 18) NOT NULL,
    high DECIMAL(36, 18) NOT NULL,
    low DECIMAL(36, 18) NOT NULL,
    close DECIMAL(36, 18) NOT NULL,
    volume DECIMAL(36, 18) NOT NULL,
    quote_volume DECIMAL(36, 18),
    trade_count INT DEFAULT 0,
    interval VARCHAR(10) NOT NULL,
    CONSTRAINT market_data_ohlc_check CHECK (high >= low AND high >= open AND high >= close AND low <= open AND low <= close)
);

-- Create hypertable
SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data (symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_interval ON market_data (interval, timestamp DESC);

-- Orderbook snapshots table
CREATE TABLE IF NOT EXISTS orderbook_snapshots (
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    bids JSONB NOT NULL,
    asks JSONB NOT NULL,
    sequence_id BIGINT,
    best_bid DECIMAL(36, 18),
    best_ask DECIMAL(36, 18),
    spread DECIMAL(36, 18)
);

-- Create hypertable for orderbook snapshots
SELECT create_hypertable('orderbook_snapshots', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orderbook_symbol_timestamp ON orderbook_snapshots (symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orderbook_sequence ON orderbook_snapshots (sequence_id);

-- Trade ticks table
CREATE TABLE IF NOT EXISTS trade_ticks (
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    quantity DECIMAL(36, 18) NOT NULL,
    side VARCHAR(4) NOT NULL,
    trade_id UUID NOT NULL,
    CONSTRAINT trade_ticks_side_check CHECK (side IN ('buy', 'sell'))
);

-- Create hypertable for trade ticks
SELECT create_hypertable('trade_ticks', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_ticks_symbol_timestamp ON trade_ticks (symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trade_ticks_trade_id ON trade_ticks (trade_id);

-- Ticker data (24h rolling statistics)
CREATE TABLE IF NOT EXISTS ticker_data (
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    last_price DECIMAL(36, 18) NOT NULL,
    volume_24h DECIMAL(36, 18) NOT NULL,
    quote_volume_24h DECIMAL(36, 18),
    price_change_24h DECIMAL(36, 18),
    price_change_percent_24h DECIMAL(10, 4),
    high_24h DECIMAL(36, 18),
    low_24h DECIMAL(36, 18),
    trades_count_24h INT
);

-- Create hypertable for ticker data
SELECT create_hypertable('ticker_data', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ticker_symbol_timestamp ON ticker_data (symbol, timestamp DESC);

-- Continuous aggregates for performance

-- 1-minute candles (from trade ticks)
CREATE MATERIALIZED VIEW IF NOT EXISTS market_data_1m
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('1 minute', timestamp) AS bucket,
    first(price, timestamp) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, timestamp) AS close,
    sum(quantity) AS volume,
    count(*) AS trade_count
FROM trade_ticks
GROUP BY symbol, bucket
WITH NO DATA;

-- Add refresh policy for 1-minute candles
SELECT add_continuous_aggregate_policy('market_data_1m',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');

-- 5-minute candles
CREATE MATERIALIZED VIEW IF NOT EXISTS market_data_5m
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('5 minutes', bucket) AS bucket,
    first(open, bucket) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, bucket) AS close,
    sum(volume) AS volume,
    sum(trade_count) AS trade_count
FROM market_data_1m
GROUP BY symbol, bucket
WITH NO DATA;

-- Add refresh policy for 5-minute candles
SELECT add_continuous_aggregate_policy('market_data_5m',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes');

-- 1-hour candles
CREATE MATERIALIZED VIEW IF NOT EXISTS market_data_1h
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('1 hour', bucket) AS bucket,
    first(open, bucket) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, bucket) AS close,
    sum(volume) AS volume,
    sum(trade_count) AS trade_count
FROM market_data_5m
GROUP BY symbol, bucket
WITH NO DATA;

-- Add refresh policy for 1-hour candles
SELECT add_continuous_aggregate_policy('market_data_1h',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- 1-day candles
CREATE MATERIALIZED VIEW IF NOT EXISTS market_data_1d
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('1 day', bucket) AS bucket,
    first(open, bucket) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, bucket) AS close,
    sum(volume) AS volume,
    sum(trade_count) AS trade_count
FROM market_data_1h
GROUP BY symbol, bucket
WITH NO DATA;

-- Add refresh policy for 1-day candles
SELECT add_continuous_aggregate_policy('market_data_1d',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- Data retention policies (keep raw data for 90 days, aggregated data longer)
SELECT add_retention_policy('trade_ticks', INTERVAL '90 days');
SELECT add_retention_policy('orderbook_snapshots', INTERVAL '30 days');
SELECT add_retention_policy('market_data', INTERVAL '365 days');
SELECT add_retention_policy('ticker_data', INTERVAL '7 days');

-- Compression policies (compress data older than 7 days)
ALTER TABLE market_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'symbol, interval',
    timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('market_data', INTERVAL '7 days');

ALTER TABLE trade_ticks SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'symbol',
    timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('trade_ticks', INTERVAL '7 days');

-- Helper function to get latest ticker
CREATE OR REPLACE FUNCTION get_latest_ticker(p_symbol VARCHAR)
RETURNS TABLE (
    symbol VARCHAR,
    last_price DECIMAL,
    volume_24h DECIMAL,
    price_change_24h DECIMAL,
    price_change_percent_24h DECIMAL,
    high_24h DECIMAL,
    low_24h DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.symbol,
        t.last_price,
        t.volume_24h,
        t.price_change_24h,
        t.price_change_percent_24h,
        t.high_24h,
        t.low_24h
    FROM ticker_data t
    WHERE t.symbol = p_symbol
    ORDER BY t.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE market_data IS 'OHLCV candlestick data for all trading pairs';
COMMENT ON TABLE orderbook_snapshots IS 'Periodic orderbook snapshots for historical analysis';
COMMENT ON TABLE trade_ticks IS 'Individual trade tick data';
COMMENT ON TABLE ticker_data IS '24-hour rolling ticker statistics';
COMMENT ON MATERIALIZED VIEW market_data_1m IS '1-minute OHLCV candles (continuous aggregate)';
COMMENT ON MATERIALIZED VIEW market_data_5m IS '5-minute OHLCV candles (continuous aggregate)';
COMMENT ON MATERIALIZED VIEW market_data_1h IS '1-hour OHLCV candles (continuous aggregate)';
COMMENT ON MATERIALIZED VIEW market_data_1d IS '1-day OHLCV candles (continuous aggregate)';



