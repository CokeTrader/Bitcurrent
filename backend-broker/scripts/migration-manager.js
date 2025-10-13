/**
 * Migration Manager
 * Apply and rollback database migrations safely
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class MigrationManager {
  /**
   * Get applied migrations
   */
  static async getAppliedMigrations() {
    try {
      const result = await pool.query(
        'SELECT version, applied_at FROM schema_migrations ORDER BY version'
      );
      return result.rows.map(r => r.version);
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Get available migrations
   */
  static async getAvailableMigrations() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    
    return files
      .filter(f => f.endsWith('.sql') && !f.includes('rollback') && !f.includes('template'))
      .sort();
  }

  /**
   * Apply a single migration
   */
  static async applyMigration(filename) {
    const migrationPath = path.join(__dirname, '../migrations', filename);
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    console.log(`\n📦 Applying migration: ${filename}`);
    
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      
      // Record migration
      const version = filename.split('-')[0];
      await pool.query(
        'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
        [version]
      );
      
      await pool.query('COMMIT');
      console.log(`✅ Migration applied: ${filename}`);
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`❌ Migration failed: ${filename}`);
      console.error(error.message);
      return false;
    }
  }

  /**
   * Rollback a migration
   */
  static async rollbackMigration(version) {
    const rollbackFile = `${version}-rollback.sql`;
    const rollbackPath = path.join(__dirname, '../migrations', rollbackFile);
    
    console.log(`\n⏮️  Rolling back migration: ${version}`);
    
    try {
      const sql = await fs.readFile(rollbackPath, 'utf8');
      
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('COMMIT');
      
      console.log(`✅ Rollback successful: ${version}`);
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`❌ Rollback failed: ${version}`);
      console.error(error.message);
      return false;
    }
  }

  /**
   * Migrate to latest
   */
  static async migrateUp() {
    console.log('\n🚀 Starting database migration...\n');
    
    const applied = await this.getAppliedMigrations();
    const available = await this.getAvailableMigrations();
    
    const pending = available.filter(f => {
      const version = f.split('-')[0];
      return !applied.includes(version);
    });
    
    if (pending.length === 0) {
      console.log('✅ Database is up to date!');
      return true;
    }
    
    console.log(`📋 Found ${pending.length} pending migration(s)\n`);
    
    for (const migration of pending) {
      const success = await this.applyMigration(migration);
      if (!success) {
        console.error('\n❌ Migration stopped due to error');
        return false;
      }
    }
    
    console.log('\n✅ All migrations applied successfully!');
    return true;
  }

  /**
   * Rollback last N migrations
   */
  static async migrateDown(count = 1) {
    console.log(`\n⏮️  Rolling back ${count} migration(s)...\n`);
    
    const applied = await this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('⚠️  No migrations to rollback');
      return true;
    }
    
    const toRollback = applied.slice(-count).reverse();
    
    for (const version of toRollback) {
      const success = await this.rollbackMigration(version);
      if (!success) {
        console.error('\n❌ Rollback stopped due to error');
        return false;
      }
    }
    
    console.log('\n✅ Rollback completed successfully!');
    return true;
  }

  /**
   * Show migration status
   */
  static async status() {
    console.log('\n📊 Migration Status\n');
    
    const applied = await this.getAppliedMigrations();
    const available = await this.getAvailableMigrations();
    
    console.log('Applied Migrations:');
    if (applied.length === 0) {
      console.log('  (none)');
    } else {
      applied.forEach(v => console.log(`  ✅ ${v}`));
    }
    
    const pending = available.filter(f => {
      const version = f.split('-')[0];
      return !applied.includes(version);
    });
    
    console.log('\nPending Migrations:');
    if (pending.length === 0) {
      console.log('  (none)');
    } else {
      pending.forEach(f => console.log(`  ⏳ ${f}`));
    }
    
    console.log('');
  }
}

// CLI
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  (async () => {
    try {
      switch (command) {
        case 'up':
          await MigrationManager.migrateUp();
          break;
        case 'down':
          await MigrationManager.migrateDown(parseInt(arg) || 1);
          break;
        case 'status':
          await MigrationManager.status();
          break;
        default:
          console.log(`
Usage:
  node migration-manager.js up          # Apply all pending migrations
  node migration-manager.js down [N]    # Rollback last N migrations
  node migration-manager.js status      # Show migration status
          `);
      }
      process.exit(0);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = MigrationManager;

