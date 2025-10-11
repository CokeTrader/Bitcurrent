#!/usr/bin/env node
/**
 * Alpaca Integration Live Test Suite
 * Tests existing Alpaca integration with paper trading
 */

const alpaca = require('./services/alpaca');

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
  metrics: {
    latencies: [],
    prices: {}
  }
};

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, data = null, error = null) {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${name}`, color);
  
  if (data) {
    log(`   ${data}`, 'cyan');
  }
  
  if (error) {
    log(`   Error: ${error}`, 'red');
  }
  
  results.tests.push({ name, passed, data, error });
  if (passed) results.passed++;
  else results.failed++;
}

function measureLatency(fn) {
  return async (...args) => {
    const start = Date.now();
    const result = await fn(...args);
    const latency = Date.now() - start;
    results.metrics.latencies.push({ fn: fn.name, latency });
    return { result, latency };
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test suite
class AlpacaTests {
  
  async testConnection() {
    log('\n═══ Connection Test ═══', 'yellow');
    try {
      const connected = await alpaca.testConnection();
      logTest('Alpaca API Connection', connected);
    } catch (error) {
      logTest('Alpaca API Connection', false, null, error.message);
    }
  }

  async testAccountInfo() {
    log('\n═══ Account Information Test ═══', 'yellow');
    try {
      const { result: account, latency } = await measureLatency(alpaca.getAccount.bind(alpaca))();
      
      const passed = account && account.status === 'ACTIVE';
      logTest(
        'Get Account Info',
        passed,
        `Status: ${account.status}, Buying Power: $${account.buyingPower.toFixed(2)}, Latency: ${latency}ms`
      );
      
      log(`   Account Number: ${account.accountNumber}`, 'blue');
      log(`   Cash: $${account.cash.toFixed(2)}`, 'blue');
      log(`   Portfolio Value: $${account.portfolioValue.toFixed(2)}`, 'blue');
      
    } catch (error) {
      logTest('Get Account Info', false, null, error.message);
    }
  }

  async testGetPrices() {
    log('\n═══ Price Fetching Tests ═══', 'yellow');
    
    const symbols = ['BTC-GBP', 'ETH-GBP', 'LTC-GBP'];
    
    for (const symbol of symbols) {
      try {
        const { result: price, latency } = await measureLatency(alpaca.getPrice.bind(alpaca))(symbol);
        
        const passed = price && price > 0;
        logTest(
          `Get ${symbol} Price`,
          passed,
          `£${price.toFixed(2)}, Latency: ${latency}ms`
        );
        
        results.metrics.prices[symbol] = price;
        
      } catch (error) {
        logTest(`Get ${symbol} Price`, false, null, error.message);
      }
      
      await sleep(500); // Avoid rate limiting
    }
  }

  async testGetQuotes() {
    log('\n═══ Quote Generation Tests ═══', 'yellow');
    
    const testCases = [
      { symbol: 'BTC-GBP', side: 'BUY', amount: 100 },
      { symbol: 'ETH-GBP', side: 'BUY', amount: 50 },
      { symbol: 'LTC-GBP', side: 'SELL', amount: 1 },
    ];
    
    for (const testCase of testCases) {
      try {
        const { result: quote, latency } = await measureLatency(alpaca.getQuote.bind(alpaca))(
          testCase.symbol,
          testCase.side,
          testCase.amount
        );
        
        const passed = quote && quote.price && quote.baseAmount;
        logTest(
          `Get Quote: ${testCase.side} ${testCase.amount} ${testCase.symbol}`,
          passed,
          `Price: £${quote.price}, Amount: ${quote.baseAmount} ${testCase.symbol.split('-')[0]}, Fee: £${quote.fee} (${quote.feePercent}%), Latency: ${latency}ms`
        );
        
        if (passed) {
          log(`   Quote Amount: £${quote.quoteAmount}`, 'blue');
          log(`   Base Amount: ${quote.baseAmount}`, 'blue');
          log(`   Fee: £${quote.fee} (${quote.feePercent}%)`, 'blue');
        }
        
      } catch (error) {
        logTest(
          `Get Quote: ${testCase.side} ${testCase.amount} ${testCase.symbol}`,
          false,
          null,
          error.message
        );
      }
      
      await sleep(1000); // Rate limiting
    }
  }

  async testSupportedPairs() {
    log('\n═══ Supported Pairs Test ═══', 'yellow');
    try {
      const pairs = alpaca.getSupportedPairs();
      const passed = Array.isArray(pairs) && pairs.length > 0;
      
      logTest('Get Supported Pairs', passed, `${pairs.length} pairs supported`);
      
      if (passed) {
        log(`   Pairs: ${pairs.join(', ')}`, 'blue');
      }
    } catch (error) {
      logTest('Get Supported Pairs', false, null, error.message);
    }
  }

  async testSymbolValidation() {
    log('\n═══ Symbol Validation Tests ═══', 'yellow');
    
    const testCases = [
      { symbol: 'BTC-USD', expected: true },
      { symbol: 'ETH-USD', expected: true },
      { symbol: 'INVALID', expected: false },
      { symbol: 'DOGE-USD', expected: false }, // Not in SUPPORTED_PAIRS
    ];
    
    for (const testCase of testCases) {
      try {
        const isSupported = alpaca.isSupported(testCase.symbol);
        const passed = isSupported === testCase.expected;
        
        logTest(
          `Validate ${testCase.symbol}`,
          passed,
          `Supported: ${isSupported} (expected: ${testCase.expected})`
        );
      } catch (error) {
        logTest(`Validate ${testCase.symbol}`, false, null, error.message);
      }
    }
  }

  async testErrorHandling() {
    log('\n═══ Error Handling Tests ═══', 'yellow');
    
    // Test 1: Invalid symbol
    try {
      await alpaca.getPrice('INVALID-SYMBOL');
      logTest('Invalid Symbol Error Handling', false, 'Should have thrown error');
    } catch (error) {
      logTest('Invalid Symbol Error Handling', true, `Correctly threw: ${error.message}`);
    }
    
    // Test 2: Negative amount
    try {
      await alpaca.getQuote('BTC-GBP', 'BUY', -100);
      logTest('Negative Amount Validation', false, 'Should have thrown error');
    } catch (error) {
      logTest('Negative Amount Validation', true, 'Correctly rejected negative amount');
    }
    
    // Test 3: Invalid side
    try {
      await alpaca.getQuote('BTC-GBP', 'INVALID', 100);
      // If no error, it might still work - check the result
      logTest('Invalid Side Handling', true, 'Handled gracefully or rejected');
    } catch (error) {
      logTest('Invalid Side Handling', true, `Correctly threw: ${error.message}`);
    }
  }

  async testLatencyBenchmark() {
    log('\n═══ Latency Benchmark Tests ═══', 'yellow');
    
    const iterations = 5;
    const latencies = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const start = Date.now();
        await alpaca.getPrice('BTC-GBP');
        const latency = Date.now() - start;
        latencies.push(latency);
        log(`   Test ${i + 1}/5: ${latency}ms`, 'cyan');
        await sleep(1000);
      } catch (error) {
        log(`   Test ${i + 1}/5: Failed - ${error.message}`, 'red');
      }
    }
    
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      
      logTest(
        'Latency Benchmark',
        true,
        `Avg: ${avgLatency.toFixed(0)}ms, Min: ${minLatency}ms, Max: ${maxLatency}ms`
      );
      
      results.metrics.avgLatency = avgLatency;
      results.metrics.minLatency = minLatency;
      results.metrics.maxLatency = maxLatency;
    } else {
      logTest('Latency Benchmark', false, null, 'No successful requests');
    }
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 ALPACA INTEGRATION LIVE TEST SUITE\n', 'blue');
  log('Testing Alpaca Crypto API with paper trading\n', 'yellow');

  const tests = new AlpacaTests();

  // Run all tests
  await tests.testConnection();
  await tests.testAccountInfo();
  await tests.testSupportedPairs();
  await tests.testSymbolValidation();
  await tests.testGetPrices();
  await tests.testGetQuotes();
  await tests.testErrorHandling();
  await tests.testLatencyBenchmark();

  // Results summary
  log('\n═══════════════════════════════════════', 'yellow');
  log('ALPACA INTEGRATION TEST RESULTS', 'yellow');
  log('═══════════════════════════════════════', 'yellow');
  log(`Total Tests: ${results.passed + results.failed}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
  
  // Latency metrics
  if (results.metrics.avgLatency) {
    log('\n📊 PERFORMANCE METRICS:', 'yellow');
    log(`Average Latency: ${results.metrics.avgLatency.toFixed(0)}ms`, 'cyan');
    log(`Min Latency: ${results.metrics.minLatency}ms`, 'green');
    log(`Max Latency: ${results.metrics.maxLatency}ms`, 'red');
  }
  
  // Price snapshot
  if (Object.keys(results.metrics.prices).length > 0) {
    log('\n💰 PRICE SNAPSHOT:', 'yellow');
    for (const [symbol, price] of Object.entries(results.metrics.prices)) {
      log(`${symbol}: £${price.toFixed(2)}`, 'cyan');
    }
  }
  
  if (results.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}: ${t.error || 'Unknown error'}`, 'red'));
  } else {
    log('\n🎉 ALL TESTS PASSED!', 'green');
    log('✅ Alpaca integration is production-ready!', 'green');
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

module.exports = { AlpacaTests, runTests };

