/**
 * Comprehensive Health Check Script
 * Verify all system components are operational
 */

const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkDatabase() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW()');
    await pool.end();

    log('✅ Database: Connected', colors.green);
    return true;
  } catch (error) {
    log(`❌ Database: ${error.message}`, colors.red);
    return false;
  }
}

async function checkStripe() {
  try {
    await stripe.balance.retrieve();
    log('✅ Stripe: Connected', colors.green);
    return true;
  } catch (error) {
    log(`❌ Stripe: ${error.message}`, colors.red);
    return false;
  }
}

async function checkAlpaca() {
  try {
    const response = await axios.get('https://paper-api.alpaca.markets/v2/account', {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_KEY_ID,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
      }
    });

    log('✅ Alpaca: Connected', colors.green);
    return true;
  } catch (error) {
    log(`❌ Alpaca: ${error.message}`, colors.red);
    return false;
  }
}

async function checkEnvironmentVariables() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'ALPACA_KEY_ID',
    'ALPACA_SECRET_KEY',
    'FRONTEND_URL'
  ];

  let allPresent = true;

  required.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set`, colors.green);
    } else {
      log(`❌ ${varName}: Missing`, colors.red);
      allPresent = false;
    }
  });

  return allPresent;
}

async function checkAPIEndpoint() {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const response = await axios.get(`${apiUrl}/health`);

    if (response.status === 200) {
      log('✅ API Endpoint: Responding', colors.green);
      return true;
    } else {
      log(`⚠️  API Endpoint: Status ${response.status}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ API Endpoint: ${error.message}`, colors.red);
    return false;
  }
}

async function checkDiskSpace() {
  try {
    const os = require('os');
    const freemem = os.freemem();
    const totalmem = os.totalmem();
    const usedPercent = ((totalmem - freemem) / totalmem) * 100;

    if (usedPercent < 90) {
      log(`✅ Memory: ${usedPercent.toFixed(1)}% used`, colors.green);
      return true;
    } else {
      log(`⚠️  Memory: ${usedPercent.toFixed(1)}% used (high)`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ Memory Check: ${error.message}`, colors.red);
    return false;
  }
}

async function runHealthCheck() {
  log('\n🏥 BitCurrent Health Check\n', colors.blue);
  log('==========================================\n');

  const results = {
    environment: await checkEnvironmentVariables(),
    database: await checkDatabase(),
    stripe: await checkStripe(),
    alpaca: await checkAlpaca(),
    api: await checkAPIEndpoint(),
    memory: await checkDiskSpace()
  };

  log('\n==========================================\n');

  const allHealthy = Object.values(results).every(r => r === true);

  if (allHealthy) {
    log('✅ ALL SYSTEMS OPERATIONAL\n', colors.green);
    process.exit(0);
  } else {
    log('❌ SOME SYSTEMS REQUIRE ATTENTION\n', colors.red);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runHealthCheck().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = runHealthCheck;

