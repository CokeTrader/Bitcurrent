/**
 * Production Load Testing
 * 
 * Simulate 1,000+ concurrent users
 * Test system under realistic load
 */

const autocannon = require('autocannon');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';

class LoadTester {
  
  /**
   * Test authentication endpoint
   */
  async testAuth() {
    console.log('🧪 Testing Authentication Endpoint...');
    
    const result = await autocannon({
      url: `${API_URL}/api/v1/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      connections: 100, // 100 concurrent connections
      duration: 30, // 30 seconds
      pipelining: 1
    });

    this.printResults('Authentication', result);
  }

  /**
   * Test portfolio endpoint (authenticated)
   */
  async testPortfolio(authToken) {
    console.log('🧪 Testing Portfolio Endpoint...');
    
    const result = await autocannon({
      url: `${API_URL}/api/v1/real-trading/portfolio`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      connections: 500, // 500 concurrent users
      duration: 60, // 1 minute
      pipelining: 1
    });

    this.printResults('Portfolio', result);
  }

  /**
   * Test real trading buy endpoint
   */
  async testBuyEndpoint(authToken) {
    console.log('🧪 Testing Buy Bitcoin Endpoint...');
    
    const result = await autocannon({
      url: `${API_URL}/api/v1/real-trading/buy`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gbpAmount: 10
      }),
      connections: 100, // 100 concurrent buys
      duration: 30,
      pipelining: 1
    });

    this.printResults('Buy Bitcoin', result);
  }

  /**
   * Test price feed endpoint
   */
  async testPriceFeed() {
    console.log('🧪 Testing Price Feed...');
    
    const result = await autocannon({
      url: `${API_URL}/api/v1/multi-asset/prices`,
      connections: 1000, // 1000 concurrent requests
      duration: 60,
      pipelining: 5 // Pipeline multiple requests
    });

    this.printResults('Price Feed', result);
  }

  /**
   * Comprehensive load test
   */
  async runFullLoadTest() {
    console.log('🚀 Starting Comprehensive Load Test...\n');
    console.log('Simulating 1,000+ concurrent users\n');
    console.log('Duration: 5 minutes\n');
    console.log('='repeat(50));

    // Test 1: Health check
    console.log('\n1. Health Check Endpoint');
    await this.testHealthCheck();

    // Test 2: Authentication
    console.log('\n2. Authentication Load');
    await this.testAuth();

    // Test 3: Price feeds (heaviest traffic)
    console.log('\n3. Price Feed Load (1000 concurrent)');
    await this.testPriceFeed();

    // Generate test token for authenticated tests
    const token = 'test_token';

    // Test 4: Portfolio queries
    console.log('\n4. Portfolio Queries (500 concurrent)');
    await this.testPortfolio(token);

    // Test 5: Trading endpoint
    console.log('\n5. Trading Endpoint (100 concurrent)');
    await this.testBuyEndpoint(token);

    console.log('\n' + '='.repeat(50));
    console.log('Load Test Complete! ✅');
    console.log('='repeat(50));
  }

  /**
   * Test health endpoint
   */
  async testHealthCheck() {
    const result = await autocannon({
      url: `${API_URL}/health`,
      connections: 1000,
      duration: 10
    });

    this.printResults('Health Check', result);
  }

  /**
   * Print test results
   */
  printResults(testName, result) {
    console.log(`\n📊 Results for ${testName}:`);
    console.log(`   Requests: ${result.requests.total}`);
    console.log(`   Avg Latency: ${result.latency.mean.toFixed(2)}ms`);
    console.log(`   Throughput: ${result.throughput.mean.toFixed(2)} bytes/sec`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Timeouts: ${result.timeouts}`);
    console.log(`   2xx: ${result['2xx']}`);
    console.log(`   4xx: ${result['4xx']}`);
    console.log(`   5xx: ${result['5xx']}`);
    
    // Performance assessment
    if (result.latency.mean < 100) {
      console.log(`   Performance: ✅ EXCELLENT`);
    } else if (result.latency.mean < 500) {
      console.log(`   Performance: ✅ GOOD`);
    } else if (result.latency.mean < 1000) {
      console.log(`   Performance: ⚠️  ACCEPTABLE`);
    } else {
      console.log(`   Performance: ❌ NEEDS IMPROVEMENT`);
    }
  }

  /**
   * Stress test - find breaking point
   */
  async stressTest() {
    console.log('🔥 Starting Stress Test (Finding Breaking Point)...\n');

    const connections = [100, 500, 1000, 2000, 5000];

    for (const connCount of connections) {
      console.log(`\nTesting with ${connCount} connections...`);
      
      const result = await autocannon({
        url: `${API_URL}/health`,
        connections: connCount,
        duration: 10
      });

      this.printResults(`${connCount} Connections`, result);

      // If error rate > 5%, stop
      const errorRate = (result.errors + result.timeouts) / result.requests.total;
      if (errorRate > 0.05) {
        console.log(`\n⚠️  Breaking point found at ${connCount} connections`);
        console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
        break;
      }
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const tester = new LoadTester();
  
  const testType = process.argv[2] || 'full';
  
  if (testType === 'stress') {
    tester.stressTest().catch(console.error);
  } else {
    tester.runFullLoadTest().catch(console.error);
  }
}

module.exports = LoadTester;

