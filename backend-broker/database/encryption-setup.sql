-- Database Encryption Setup
-- Encrypt sensitive columns using pgcrypto

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive data
ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_ssn_last4 BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_phone BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_address BYTEA;

-- Create table for encrypted API secrets
CREATE TABLE IF NOT EXISTS encrypted_secrets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_type VARCHAR(50) NOT NULL, -- 'api_key', 'bank_account', 'wallet_seed'
  encrypted_value BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP
);

-- Function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_data(p_data TEXT, p_key TEXT DEFAULT current_setting('app.encryption_key'))
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_data, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_data(p_encrypted BYTEA, p_key TEXT DEFAULT current_setting('app.encryption_key'))
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store encrypted secret
CREATE OR REPLACE FUNCTION store_encrypted_secret(
  p_user_id INTEGER,
  p_secret_type VARCHAR,
  p_value TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_secret_id INTEGER;
BEGIN
  INSERT INTO encrypted_secrets (user_id, secret_type, encrypted_value, created_at)
  VALUES (p_user_id, p_secret_type, encrypt_data(p_value), NOW())
  RETURNING id INTO v_secret_id;
  
  RETURN v_secret_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve encrypted secret
CREATE OR REPLACE FUNCTION get_encrypted_secret(
  p_user_id INTEGER,
  p_secret_type VARCHAR
)
RETURNS TEXT AS $$
DECLARE
  v_encrypted BYTEA;
BEGIN
  SELECT encrypted_value INTO v_encrypted
  FROM encrypted_secrets
  WHERE user_id = p_user_id AND secret_type = p_secret_type
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Update last accessed
  UPDATE encrypted_secrets
  SET last_accessed = NOW()
  WHERE user_id = p_user_id AND secret_type = p_secret_type;
  
  RETURN decrypt_data(v_encrypted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_encrypted_secrets_user ON encrypted_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_secrets_type ON encrypted_secrets(secret_type);

-- Comments
COMMENT ON TABLE encrypted_secrets IS 'Encrypted storage for sensitive user data';
COMMENT ON FUNCTION encrypt_data IS 'Encrypt sensitive data using AES';
COMMENT ON FUNCTION decrypt_data IS 'Decrypt encrypted data';
COMMENT ON FUNCTION store_encrypted_secret IS 'Store encrypted secret for user';
COMMENT ON FUNCTION get_encrypted_secret IS 'Retrieve and decrypt secret for user';

-- Example usage:
-- SELECT store_encrypted_secret(1, 'api_key', 'sk_test_abc123');
-- SELECT get_encrypted_secret(1, 'api_key');

