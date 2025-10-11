#!/usr/bin/env node
/**
 * Bitcurrent Backend API Test Suite
 * Comprehensive testing of all backend endpoints
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8080';
const TEST_EMAIL = `test${Date.now()}@bitcurrent-test.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, error = null) {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${name}`, color);
  
  if (error) {
    log(`   Error: ${error}`, 'red');
  }
  
  results.tests.push({ name, passed, error });
  if (passed) results.passed++;
  else results.failed++;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test suite
class BackendTests {
  constructor() {
    this.token = null;
    this.userId = null;
  }

  async testHealthCheck() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      logTest('Health Check', response.data.success === true);
    } catch (error) {
      logTest('Health Check', false, error.message);
    }
  }

  async testUserRegistration() {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: 'Test',
        lastName: 'User'
      });
      
      const passed = response.data.success === true && response.data.token;
      this.token = response.data.token;
      this.userId = response.data.user?.id;
      
      logTest('User Registration', passed);
    } catch (error) {
      logTest('User Registration', false, error.response?.data?.error || error.message);
    }
  }

  async testUserLogin() {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      const passed = response.data.success === true && response.data.token;
      if (passed) {
        this.token = response.data.token;
      }
      
      logTest('User Login', passed);
    } catch (error) {
      logTest('User Login', false, error.response?.data?.error || error.message);
    }
  }

  async testGetCurrentUser() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const passed = response.data.success === true && response.data.user;
      logTest('Get Current User', passed);
    } catch (error) {
      logTest('Get Current User', false, error.response?.data?.error || error.message);
    }
  }

  async testGetBalances() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/balances`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const passed = response.data.success === true && Array.isArray(response.data.balances);
      logTest('Get Balances', passed);
    } catch (error) {
      logTest('Get Balances', false, error.response?.data?.error || error.message);
    }
  }

  async testGetQuote() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders/quote`, {
        params: {
          symbol: 'BTC-GBP',
          side: 'BUY',
          amount: 100
        },
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const passed = response.data.success === true && response.data.quote;
      if (passed) {
        log(`   Quote: £${response.data.quote.quoteAmount} → ${response.data.quote.baseAmount} BTC`, 'blue');
        log(`   Price: £${response.data.quote.price}/BTC`, 'blue');
        log(`   Fee: £${response.data.quote.fee} (${response.data.quote.feePercent}%)`, 'blue');
      }
      
      logTest('Get BTC Quote', passed);
    } catch (error) {
      logTest('Get BTC Quote', false, error.response?.data?.error || error.message);
    }
  }

  async testGetQuoteMultipleSymbols() {
    const symbols = ['ETH-GBP', 'LTC-GBP', 'BCH-GBP'];
    
    for (const symbol of symbols) {
      try {
        const response = await axios.get(`${API_URL}/api/v1/orders/quote`, {
          params: {
            symbol,
            side: 'BUY',
            amount: 50
          },
          headers: { Authorization: `Bearer ${this.token}` }
        });
        
        const passed = response.data.success === true && response.data.quote;
        logTest(`Get ${symbol} Quote`, passed);
        
        if (passed) {
          log(`   Price: £${response.data.quote.price}`, 'blue');
        }
      } catch (error) {
        logTest(`Get ${symbol} Quote`, false, error.response?.data?.error || error.message);
      }
      
      await sleep(500); // Rate limiting
    }
  }

  async testGetOrders() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const passed = response.data.success === true && Array.isArray(response.data.orders);
      logTest('Get Orders History', passed);
    } catch (error) {
      logTest('Get Orders History', false, error.response?.data?.error || error.message);
    }
  }

  async testCreateDeposit() {
    try {
      const response = await axios.post(`${API_URL}/api/v1/deposits`, {
        currency: 'GBP',
        amount: 100,
        bankReference: `TEST${Date.now()}`
      }, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const passed = response.data.success === true && response.data.deposit;
      logTest('Create Deposit Request', passed);
    } catch (error) {
      logTest('Create Deposit Request', false, error.response?.data?.error || error.message);
    }
  }

  async testGetDeposits() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/deposits`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      const passed = response.data.success === true && Array.isArray(response.data.deposits);
      logTest('Get Deposits', passed);
    } catch (error) {
      logTest('Get Deposits', false, error.response?.data?.error || error.message);
    }
  }

  async testInvalidAuthentication() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/balances`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      
      // Should fail
      logTest('Invalid Token Rejection', false, 'Token was accepted (should be rejected)');
    } catch (error) {
      // Should get 401
      const passed = error.response?.status === 401;
      logTest('Invalid Token Rejection', passed);
    }
  }

  async testMissingParameters() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders/quote`, {
        params: {
          symbol: 'BTC-GBP'
          // Missing side and amount
        },
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      logTest('Missing Parameters Validation', false, 'Request succeeded (should fail)');
    } catch (error) {
      const passed = error.response?.status === 400;
      logTest('Missing Parameters Validation', passed);
    }
  }

  async testInvalidSymbol() {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders/quote`, {
        params: {
          symbol: 'INVALID',
          side: 'BUY',
          amount: 100
        },
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      logTest('Invalid Symbol Rejection', false, 'Invalid symbol accepted');
    } catch (error) {
      const passed = error.response?.status === 400 || error.response?.status === 500;
      logTest('Invalid Symbol Rejection', passed);
    }
  }

  async testRateLimiting() {
    try {
      const requests = [];
      // Attempt 200 requests rapidly (should hit rate limit)
      for (let i = 0; i < 200; i++) {
        requests.push(
          axios.get(`${API_URL}/health`).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r?.status === 429);
      
      logTest('Rate Limiting Active', rateLimited);
    } catch (error) {
      logTest('Rate Limiting Active', false, error.message);
    }
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 BITCURRENT BACKEND API TEST SUITE\n', 'blue');
  log(`Testing: ${API_URL}\n`, 'yellow');

  const tests = new BackendTests();

  // Basic health check
  log('═══ Basic Health Check ═══', 'yellow');
  await tests.testHealthCheck();
  
  // Authentication tests
  log('\n═══ Authentication Tests ═══', 'yellow');
  await tests.testUserRegistration();
  await sleep(500);
  await tests.testUserLogin();
  await sleep(500);
  await tests.testGetCurrentUser();
  
  // Balance tests
  log('\n═══ Balance Tests ═══', 'yellow');
  await tests.testGetBalances();
  
  // Order/Quote tests
  log('\n═══ Order & Quote Tests ═══', 'yellow');
  await tests.testGetQuote();
  await sleep(1000);
  await tests.testGetQuoteMultipleSymbols();
  await sleep(500);
  await tests.testGetOrders();
  
  // Deposit tests
  log('\n═══ Deposit Tests ═══', 'yellow');
  await tests.testCreateDeposit();
  await sleep(500);
  await tests.testGetDeposits();
  
  // Security tests
  log('\n═══ Security Tests ═══', 'yellow');
  await tests.testInvalidAuthentication();
  await tests.testMissingParameters();
  await tests.testInvalidSymbol();
  await tests.testRateLimiting();
  
  // Results summary
  log('\n═══════════════════════════════════════', 'yellow');
  log(`TEST RESULTS`, 'yellow');
  log('═══════════════════════════════════════', 'yellow');
  log(`Total Tests: ${results.passed + results.failed}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
  
  if (results.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}: ${t.error}`, 'red'));
  } else {
    log('\n🎉 ALL TESTS PASSED!', 'green');
  }
  
  log('\n');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = { BackendTests, runTests };

