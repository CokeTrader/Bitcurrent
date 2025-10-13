/**
 * Enhanced Load Testing Script
 * Based on research: Performance testing ensures quality during rapid iteration
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const API_URL = process.env.API_URL || 'http://localhost:4000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 100;
const TEST_DURATION_MS = parseInt(process.env.TEST_DURATION_MS) || 60000; // 1 minute
const RAMP_UP_TIME_MS = 10000; // 10 seconds

class LoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  async runTest() {
    console.log('\n🔥 Enhanced Load Test Starting...\n');
    console.log(`Target: ${API_URL}`);
    console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`Duration: ${TEST_DURATION_MS / 1000}s`);
    console.log(`Ramp-up: ${RAMP_UP_TIME_MS / 1000}s\n`);

    this.results.startTime = Date.now();

    // Ramp up users gradually
    const userPromises = [];
    const rampUpDelay = RAMP_UP_TIME_MS / CONCURRENT_USERS;

    for (let i = 0; i < CONCURRENT_USERS; i++) {
      await this.sleep(rampUpDelay);
      userPromises.push(this.simulateUser(i));
    }

    // Wait for all users to finish
    await Promise.all(userPromises);

    this.results.endTime = Date.now();
    this.printResults();
  }

  async simulateUser(userId) {
    const userStartTime = Date.now();
    const userEndTime = userStartTime + TEST_DURATION_MS - RAMP_UP_TIME_MS;

    while (Date.now() < userEndTime) {
      // Random endpoint selection (weighted)
      const rand = Math.random();
      let endpoint;

      if (rand < 0.4) {
        endpoint = '/api/v1/markets'; // 40% - most common
      } else if (rand < 0.7) {
        endpoint = '/api/v1/markets/BTCUSD/ticker'; // 30%
      } else if (rand < 0.9) {
        endpoint = '/health'; // 20%
      } else {
        endpoint = '/api/v1/markets/BTCUSD/orderbook'; // 10%
      }

      await this.makeRequest(endpoint);

      // Random think time (100-500ms)
      await this.sleep(100 + Math.random() * 400);
    }
  }

  async makeRequest(endpoint) {
    const start = performance.now();
    
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, {
        timeout: 10000
      });

      const duration = performance.now() - start;
      
      this.results.totalRequests++;
      this.results.successfulRequests++;
      this.results.responseTimes.push(duration);

      if (duration > 1000) {
        console.log(`⚠️  Slow response: ${endpoint} took ${duration.toFixed(0)}ms`);
      }
    } catch (error) {
      const duration = performance.now() - start;
      
      this.results.totalRequests++;
      this.results.failedRequests++;
      this.results.errors.push({
        endpoint,
        error: error.message,
        duration
      });

      console.log(`❌ Failed: ${endpoint} - ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(60) + '\n');

    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const rps = this.results.totalRequests / duration;

    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests} (${(this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2)}%)`);
    console.log(`Failed: ${this.results.failedRequests} (${(this.results.failedRequests / this.results.totalRequests * 100).toFixed(2)}%)`);
    console.log(`Requests/Second: ${rps.toFixed(2)}`);

    if (this.results.responseTimes.length > 0) {
      const sorted = this.results.responseTimes.sort((a, b) => a - b);
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];

      console.log('\nResponse Times:');
      console.log(`  Min: ${min.toFixed(0)}ms`);
      console.log(`  Avg: ${avg.toFixed(0)}ms`);
      console.log(`  P50: ${p50.toFixed(0)}ms`);
      console.log(`  P95: ${p95.toFixed(0)}ms`);
      console.log(`  P99: ${p99.toFixed(0)}ms`);
      console.log(`  Max: ${max.toFixed(0)}ms`);
    }

    // Performance Assessment
    console.log('\n📈 Performance Assessment:');
    const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    const errorRate = (this.results.failedRequests / this.results.totalRequests) * 100;

    if (avgResponseTime < 200 && errorRate < 1) {
      console.log('  🟢 EXCELLENT - Ready for production');
    } else if (avgResponseTime < 500 && errorRate < 5) {
      console.log('  🟡 GOOD - Some optimization recommended');
    } else if (avgResponseTime < 1000 && errorRate < 10) {
      console.log('  🟠 FAIR - Optimization needed');
    } else {
      console.log('  🔴 POOR - Significant optimization required');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Error summary
    if (this.results.errors.length > 0) {
      console.log('Error Summary:');
      const errorTypes = {};
      this.results.errors.forEach(e => {
        errorTypes[e.error] = (errorTypes[e.error] || 0) + 1;
      });
      Object.entries(errorTypes).forEach(([error, count]) => {
        console.log(`  ${error}: ${count} occurrences`);
      });
      console.log('');
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const tester = new LoadTester();
  tester.runTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = LoadTester;

