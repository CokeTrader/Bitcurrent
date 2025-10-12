-- Make the admin user an admin
-- Run this SQL command in Railway PostgreSQL Database Query tab

UPDATE users 
SET is_admin = true 
WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';

-- Verify the update
SELECT id, email, is_admin, created_at 
FROM users 
WHERE id = 'e15b0928-7767-44d1-9923-e9a47eb2682a';

-- This should show:
-- id: e15b0928-7767-44d1-9923-e9a47eb2682a
-- email: admin@bitcurrent.co.uk
-- is_admin: true
-- created_at: (timestamp)

