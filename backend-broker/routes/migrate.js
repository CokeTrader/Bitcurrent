// Database migration endpoint (admin only, one-time use)
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Migration endpoint - ONLY run this once!
router.post('/run', async (req, res) => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Read schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('✅ Loaded schema.sql');
    
    // Execute schema
    await pool.query(schema);
    console.log('✅ Schema executed successfully!');
    
    // Add 2FA columns if they don't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';
    `);
    console.log('✅ 2FA and OAuth columns added');
    
    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📊 Created tables:', tables);
    
    res.json({
      success: true,
      message: 'Database migrations completed successfully!',
      tables: tables,
      tablesCreated: tables.length
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check migration status
router.get('/status', async (req, res) => {
  try {
    // Check if users table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = result.rows.map(row => row.table_name);
    const expectedTables = ['users', 'accounts', 'orders', 'transactions', 'deposits', 'withdrawals'];
    const migrationComplete = expectedTables.every(table => tables.includes(table));
    
    res.json({
      success: true,
      migrationComplete,
      tables,
      tablesCount: tables.length,
      expectedTables,
      missingTables: expectedTables.filter(t => !tables.includes(t))
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add is_admin column and promote admin user
router.post('/add-admin-column', async (req, res) => {
  try {
    console.log('🔄 Adding is_admin column...');
    
    // Add is_admin column
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ is_admin column added');
    
    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
    `);
    console.log('✅ Index created');
    
    // Make admin user an admin
    const result = await pool.query(`
      UPDATE users SET is_admin = TRUE WHERE email = 'admin@bitcurrent.co.uk' RETURNING id, email, is_admin;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Admin user promoted:', result.rows[0]);
    }
    
    res.json({
      success: true,
      message: 'is_admin column added and admin user promoted',
      adminUser: result.rows[0] || null
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add paper_trading_accounts table
router.post('/add-paper-trading-table', async (req, res) => {
  try {
    console.log('🔄 Creating paper_trading_accounts table...');
    
    // Create paper_trading_accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paper_trading_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        initial_balance NUMERIC(20, 2) NOT NULL CHECK (initial_balance >= 100 AND initial_balance <= 100000),
        current_balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        reset_at TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);
    console.log('✅ paper_trading_accounts table created');
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paper_accounts_user_id ON paper_trading_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_paper_accounts_active ON paper_trading_accounts(user_id, is_active) WHERE is_active = TRUE;
    `);
    console.log('✅ Indexes created');
    
    res.json({
      success: true,
      message: 'paper_trading_accounts table created successfully'
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

