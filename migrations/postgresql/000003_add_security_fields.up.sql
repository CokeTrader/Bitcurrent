-- BitCurrent Exchange - Add Security Fields
-- Migration: 000003_add_security_fields

-- Add 2FA fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes_hash TEXT[];

-- Add WebAuthn support
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    aaguid TEXT,
    sign_count BIGINT DEFAULT 0,
    device_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential_id ON webauthn_credentials(credential_id);

-- Session management table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Security events table (complement to audit_logs)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT security_events_severity_check CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);

-- IP whitelist for accounts (optional security feature)
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    description VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    CONSTRAINT ip_whitelist_account_ip UNIQUE (account_id, ip_address)
);

CREATE INDEX idx_ip_whitelist_account ON ip_whitelist(account_id);
CREATE INDEX idx_ip_whitelist_enabled ON ip_whitelist(enabled);

-- Device fingerprints for fraud detection
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_hash VARCHAR(255) NOT NULL,
    first_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    trusted BOOLEAN DEFAULT FALSE,
    device_info JSONB,
    CONSTRAINT device_fingerprints_unique UNIQUE (user_id, fingerprint_hash)
);

CREATE INDEX idx_device_fingerprints_user ON device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);

-- Add password history for preventing reuse
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_history_user ON password_history(user_id);
CREATE INDEX idx_password_history_created ON password_history(created_at DESC);

-- Withdrawal whitelist addresses
CREATE TABLE IF NOT EXISTS withdrawal_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    address VARCHAR(255) NOT NULL,
    label VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMPTZ,
    CONSTRAINT withdrawal_whitelist_unique UNIQUE (account_id, currency, address)
);

CREATE INDEX idx_withdrawal_whitelist_account ON withdrawal_whitelist(account_id);
CREATE INDEX idx_withdrawal_whitelist_currency ON withdrawal_whitelist(currency);

-- Comments
COMMENT ON TABLE webauthn_credentials IS 'Hardware key (FIDO2/WebAuthn) credentials';
COMMENT ON TABLE user_sessions IS 'Active user sessions for session management';
COMMENT ON TABLE security_events IS 'Security-related events for monitoring';
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens with expiry';
COMMENT ON TABLE ip_whitelist IS 'IP whitelist for enhanced account security';
COMMENT ON TABLE device_fingerprints IS 'Device fingerprints for fraud detection';
COMMENT ON TABLE password_history IS 'Password history to prevent reuse';
COMMENT ON TABLE withdrawal_whitelist IS 'Whitelisted withdrawal addresses';



