-- BitCurrent Exchange - Seed Data for Development
-- This script creates demo users, accounts, and initial data

-- Demo user 1 (Admin/Test User)
INSERT INTO users (id, email, email_verified, password_hash, kyc_level, kyc_status, country_code, first_name, last_name, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@bitcurrent.local', true, '$2a$10$rKJ5Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z', 3, 'approved', 'GB', 'Admin', 'User', 'active'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'trader1@bitcurrent.local', true, '$2a$10$rKJ5Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z', 2, 'approved', 'GB', 'John', 'Trader', 'active'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'trader2@bitcurrent.local', true, '$2a$10$rKJ5Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z.D0Q0K3Z', 2, 'approved', 'GB', 'Jane', 'Investor', 'active')
ON CONFLICT (email) DO NOTHING;

-- Create spot accounts for demo users
INSERT INTO accounts (id, user_id, account_type, status)
VALUES 
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'spot', 'active'),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'spot', 'active'),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'spot', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create wallets with initial balances
INSERT INTO wallets (account_id, currency, wallet_type, balance, available_balance, reserved_balance)
VALUES 
    -- Admin user wallets
    ('10000000-0000-0000-0000-000000000001'::uuid, 'GBP', 'fiat', 100000.00, 100000.00, 0),
    ('10000000-0000-0000-0000-000000000001'::uuid, 'BTC', 'hot', 10.00000000, 10.00000000, 0),
    ('10000000-0000-0000-0000-000000000001'::uuid, 'ETH', 'hot', 100.00000000, 100.00000000, 0),
    ('10000000-0000-0000-0000-000000000001'::uuid, 'SOL', 'hot', 1000.00000000, 1000.00000000, 0),
    
    -- Trader 1 wallets
    ('10000000-0000-0000-0000-000000000002'::uuid, 'GBP', 'fiat', 50000.00, 50000.00, 0),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'BTC', 'hot', 2.50000000, 2.50000000, 0),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'ETH', 'hot', 25.00000000, 25.00000000, 0),
    
    -- Trader 2 wallets
    ('10000000-0000-0000-0000-000000000003'::uuid, 'GBP', 'fiat', 75000.00, 75000.00, 0),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'BTC', 'hot', 1.00000000, 1.00000000, 0),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'ETH', 'hot', 15.00000000, 15.00000000, 0)
ON CONFLICT (account_id, currency) DO NOTHING;

-- Create corresponding ledger entries for initial balances
INSERT INTO ledger_entries (account_id, currency, amount, balance_after, entry_type, description)
VALUES 
    ('10000000-0000-0000-0000-000000000001'::uuid, 'GBP', 100000.00, 100000.00, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000001'::uuid, 'BTC', 10.00000000, 10.00000000, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000001'::uuid, 'ETH', 100.00000000, 100.00000000, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000001'::uuid, 'SOL', 1000.00000000, 1000.00000000, 'deposit', 'Initial demo balance'),
    
    ('10000000-0000-0000-0000-000000000002'::uuid, 'GBP', 50000.00, 50000.00, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'BTC', 2.50000000, 2.50000000, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'ETH', 25.00000000, 25.00000000, 'deposit', 'Initial demo balance'),
    
    ('10000000-0000-0000-0000-000000000003'::uuid, 'GBP', 75000.00, 75000.00, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'BTC', 1.00000000, 1.00000000, 'deposit', 'Initial demo balance'),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'ETH', 15.00000000, 15.00000000, 'deposit', 'Initial demo balance');

-- Insert some demo market data
INSERT INTO trade_ticks (symbol, timestamp, price, quantity, side, trade_id)
VALUES 
    ('BTC-GBP', NOW() - INTERVAL '1 hour', 45000.00, 0.1, 'buy', uuid_generate_v4()),
    ('BTC-GBP', NOW() - INTERVAL '50 minutes', 45100.00, 0.05, 'buy', uuid_generate_v4()),
    ('BTC-GBP', NOW() - INTERVAL '40 minutes', 45050.00, 0.15, 'sell', uuid_generate_v4()),
    ('BTC-GBP', NOW() - INTERVAL '30 minutes', 45200.00, 0.08, 'buy', uuid_generate_v4()),
    ('BTC-GBP', NOW() - INTERVAL '20 minutes', 45150.00, 0.12, 'sell', uuid_generate_v4()),
    ('BTC-GBP', NOW() - INTERVAL '10 minutes', 45250.00, 0.2, 'buy', uuid_generate_v4()),
    
    ('ETH-GBP', NOW() - INTERVAL '1 hour', 2500.00, 1.5, 'buy', uuid_generate_v4()),
    ('ETH-GBP', NOW() - INTERVAL '50 minutes', 2510.00, 0.8, 'buy', uuid_generate_v4()),
    ('ETH-GBP', NOW() - INTERVAL '40 minutes', 2505.00, 2.0, 'sell', uuid_generate_v4()),
    ('ETH-GBP', NOW() - INTERVAL '30 minutes', 2520.00, 1.2, 'buy', uuid_generate_v4()),
    ('ETH-GBP', NOW() - INTERVAL '20 minutes', 2515.00, 1.8, 'sell', uuid_generate_v4()),
    ('ETH-GBP', NOW() - INTERVAL '10 minutes', 2530.00, 2.5, 'buy', uuid_generate_v4());

-- Refresh continuous aggregates
CALL refresh_continuous_aggregate('market_data_1m', NOW() - INTERVAL '2 hours', NOW());

ECHO 'Seed data loaded successfully!';
ECHO 'Demo users:';
ECHO '  - admin@bitcurrent.local (KYC Level 3)';
ECHO '  - trader1@bitcurrent.local (KYC Level 2)';
ECHO '  - trader2@bitcurrent.local (KYC Level 2)';
ECHO '';
ECHO 'All demo users have password: DemoPassword123!';



