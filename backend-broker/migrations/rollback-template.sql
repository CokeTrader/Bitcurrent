/**
 * Migration Rollback Template
 * Every migration MUST have a corresponding rollback
 */

-- Migration: [MIGRATION_NAME]
-- Version: [VERSION_NUMBER]
-- Date: [DATE]
-- Author: [AUTHOR]

-- ==============================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================

-- To rollback this migration, run:
-- psql $DATABASE_URL -f rollback-[VERSION].sql

BEGIN;

-- ==============================================
-- ROLLBACK CHANGES (in reverse order)
-- ==============================================

-- Example: If migration added a column, drop it
-- ALTER TABLE users DROP COLUMN IF EXISTS new_column;

-- Example: If migration created a table, drop it
-- DROP TABLE IF EXISTS new_table CASCADE;

-- Example: If migration added an index, drop it
-- DROP INDEX IF EXISTS idx_table_column;

-- Example: If migration modified data, restore it
-- UPDATE users SET status = 'active' WHERE status = 'verified';

-- ==============================================
-- VERIFY ROLLBACK
-- ==============================================

-- Add verification queries to ensure rollback succeeded
-- SELECT COUNT(*) FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'new_column';
-- Expected: 0

-- ==============================================
-- UPDATE MIGRATION VERSION
-- ==============================================

DELETE FROM schema_migrations WHERE version = '[VERSION_NUMBER]';

COMMIT;

-- ==============================================
-- POST-ROLLBACK CHECKLIST
-- ==============================================

-- [ ] Verify schema changes reverted
-- [ ] Check data integrity
-- [ ] Test application functionality
-- [ ] Update migration tracking
-- [ ] Notify team if production rollback

