-- BitCurrent Exchange - Rollback Market Data TimescaleDB Schema
-- Migration: 000002_market_data_timescale (DOWN)

-- Drop helper functions
DROP FUNCTION IF EXISTS get_latest_ticker(VARCHAR);

-- Drop continuous aggregates (in dependency order)
DROP MATERIALIZED VIEW IF EXISTS market_data_1d CASCADE;
DROP MATERIALIZED VIEW IF EXISTS market_data_1h CASCADE;
DROP MATERIALIZED VIEW IF EXISTS market_data_5m CASCADE;
DROP MATERIALIZED VIEW IF EXISTS market_data_1m CASCADE;

-- Drop hypertables
DROP TABLE IF EXISTS ticker_data CASCADE;
DROP TABLE IF EXISTS trade_ticks CASCADE;
DROP TABLE IF EXISTS orderbook_snapshots CASCADE;
DROP TABLE IF EXISTS market_data CASCADE;



