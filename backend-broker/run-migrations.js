// Run database migrations on Railway PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use Railway DATABASE_URL from backend
const DATABASE_URL = process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ Usage: node run-migrations.js <DATABASE_URL>');
  console.error('Example: node run-migrations.js "postgres://user:pass@host:5432/db"');
  process.exit(1);
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Railway requires this
    }
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL!');

    console.log('\\n📋 Running migrations...');
    
    // Read schema.sql
    const schemaPath = path.join(__dirname, 'backend-broker/database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('✅ Loaded schema.sql');
    
    // Execute schema
    await pool.query(schema);
    console.log('✅ Schema created successfully!');
    
    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    console.log('\\n🎉 Migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

