-- Migration: Email Notification Logs
-- Track all email notifications sent

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'bounced'
  error TEXT,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'))
);

-- Email preferences
CREATE TABLE IF NOT EXISTS email_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  trade_confirmations BOOLEAN DEFAULT true,
  deposit_confirmations BOOLEAN DEFAULT true,
  price_alerts BOOLEAN DEFAULT true,
  bot_notifications BOOLEAN DEFAULT true,
  weekly_summaries BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);

-- Comments
COMMENT ON TABLE email_logs IS 'Tracks all emails sent from the platform';
COMMENT ON TABLE email_preferences IS 'User email notification preferences';

