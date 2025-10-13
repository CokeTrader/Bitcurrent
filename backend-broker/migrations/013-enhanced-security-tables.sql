-- Migration: Enhanced Security Tables
-- JWT refresh tokens, token blacklist, security audit logs

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id VARCHAR(100) NOT NULL UNIQUE,
  fingerprint_hash VARCHAR(100) NOT NULL,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Token blacklist (for logged out tokens)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(100) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'login', 'failed_login', 'password_change', 'withdrawal', etc.
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical', NULL))
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP DEFAULT NOW(),
  locked_until TIMESTAMP
);

-- Suspicious activity tracking
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  risk_score INTEGER, -- 0-100
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'false_positive', 'confirmed'
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id)
);

-- API key management
CREATE TABLE IF NOT EXISTS api_keys_enhanced (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '{"read": true, "trade": false, "withdraw": false}',
  ip_whitelist JSONB, -- Array of allowed IPs
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Withdrawal whitelist addresses
CREATE TABLE IF NOT EXISTS withdrawal_whitelist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  address VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  verification_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  
  CONSTRAINT unique_user_asset_address UNIQUE (user_id, asset, address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_id ON refresh_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_status ON suspicious_activities(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_whitelist_user ON withdrawal_whitelist(user_id);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id INTEGER,
  p_event_type VARCHAR,
  p_ip_address INET,
  p_details JSONB,
  p_risk_level VARCHAR DEFAULT 'low'
)
RETURNS void AS $$
BEGIN
  INSERT INTO security_audit_logs (user_id, event_type, ip_address, details, risk_level, created_at)
  VALUES (p_user_id, p_event_type, p_ip_address, p_details, p_risk_level, NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check and lock account after failed logins
CREATE OR REPLACE FUNCTION check_failed_logins(p_email VARCHAR, p_ip_address INET)
RETURNS TABLE(locked BOOLEAN, locked_until TIMESTAMP) AS $$
DECLARE
  v_count INTEGER;
  v_lock_until TIMESTAMP;
BEGIN
  -- Get current attempt count
  SELECT attempt_count, locked_until 
  INTO v_count, v_lock_until
  FROM failed_login_attempts
  WHERE email = p_email AND ip_address = p_ip_address;

  -- If locked, check if lock expired
  IF v_lock_until IS NOT NULL AND v_lock_until > NOW() THEN
    RETURN QUERY SELECT true, v_lock_until;
    RETURN;
  END IF;

  -- If more than 5 attempts, lock for 30 minutes
  IF v_count >= 5 THEN
    v_lock_until := NOW() + INTERVAL '30 minutes';
    
    UPDATE failed_login_attempts
    SET locked_until = v_lock_until
    WHERE email = p_email AND ip_address = p_ip_address;
    
    RETURN QUERY SELECT true, v_lock_until;
  ELSE
    RETURN QUERY SELECT false, NULL::TIMESTAMP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up old blacklisted tokens
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for token rotation';
COMMENT ON TABLE token_blacklist IS 'Blacklisted JWTs (logged out sessions)';
COMMENT ON TABLE security_audit_logs IS 'Complete audit trail of security events';
COMMENT ON TABLE failed_login_attempts IS 'Track and prevent brute force attacks';
COMMENT ON TABLE suspicious_activities IS 'Flagged suspicious user activities for review';
COMMENT ON TABLE api_keys_enhanced IS 'Enhanced API key management with permissions';
COMMENT ON TABLE withdrawal_whitelist IS 'Pre-approved withdrawal addresses';

