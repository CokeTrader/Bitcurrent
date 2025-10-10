-- BitCurrent Exchange - Rollback Initial Schema
-- Migration: 000001_init_schema (DOWN)

-- Drop triggers
DROP TRIGGER IF EXISTS update_trading_pairs_updated_at ON trading_pairs;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS trading_pairs;
DROP TABLE IF EXISTS kyc_documents;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS withdrawals;
DROP TABLE IF EXISTS deposits;
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- Drop extensions
DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "uuid-ossp";



