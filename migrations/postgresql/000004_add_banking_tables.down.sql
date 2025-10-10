-- BitCurrent Exchange - Rollback Banking Tables
-- Migration: 000004_add_banking_tables (DOWN)

-- Drop triggers
DROP TRIGGER IF EXISTS update_ob_connections_updated_at ON open_banking_connections;
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;

-- Drop tables in reverse order
DROP TABLE IF EXISTS payment_reconciliation_reports;
DROP TABLE IF EXISTS open_banking_connections;
DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS bank_accounts;



