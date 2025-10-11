-- Rollback password reset and email verification features

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();

ALTER TABLE users DROP COLUMN IF EXISTS account_locked_until;
ALTER TABLE users DROP COLUMN IF EXISTS failed_login_attempts;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_sent_at;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_sent_at;

DROP TABLE IF EXISTS login_history;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS password_reset_tokens;






