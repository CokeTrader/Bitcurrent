/**
 * Rollback: Initial Database Schema
 * Version: 001
 * Date: October 2025
 */

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS staking_positions CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS kyc_status CASCADE;

-- Remove version tracking
DELETE FROM schema_migrations WHERE version = '001';

COMMIT;

-- Verification: Ensure tables are gone
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'orders', 'balances', 'deposits');
-- Expected: 0 rows

