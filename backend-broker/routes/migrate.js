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

module.exports = router;

