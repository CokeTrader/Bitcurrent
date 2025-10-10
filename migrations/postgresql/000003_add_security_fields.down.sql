-- BitCurrent Exchange - Rollback Security Fields
-- Migration: 000003_add_security_fields (DOWN)

-- Drop tables in reverse order
DROP TABLE IF EXISTS withdrawal_whitelist;
DROP TABLE IF EXISTS password_history;
DROP TABLE IF EXISTS device_fingerprints;
DROP TABLE IF EXISTS ip_whitelist;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS webauthn_credentials;

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS backup_codes_hash;
ALTER TABLE users DROP COLUMN IF EXISTS totp_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS totp_secret;



