/**
 * Performance testing script
 * Benchmark API endpoints
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

async function benchmark(endpoint, method = 'GET', data = null, iterations = 100) {
  console.log(`\n📊 Benchmarking ${method} ${endpoint}`);
  console.log(`Iterations: ${iterations}`);
  
  const times = [];
  let errors = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    try {
      if (method === 'GET') {
        await axios.get(`${BASE_URL}${endpoint}`);
      } else if (method === 'POST') {
        await axios.post(`${BASE_URL}${endpoint}`, data);
      }
      
      const duration = Date.now() - start;
      times.push(duration);
    } catch (error) {
      errors++;
    }
  }
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  console.log(`\nResults:`);
  console.log(`  Min: ${min}ms`);
  console.log(`  Max: ${max}ms`);
  console.log(`  Avg: ${avg.toFixed(2)}ms`);
  console.log(`  P50: ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms`);
  console.log(`  Errors: ${errors}/${iterations} (${(errors/iterations*100).toFixed(1)}%)`);
  console.log(`  RPS: ${(1000/avg).toFixed(2)} req/s`);
  
  return { avg, min, max, p95, p99, errors };
}

async function runTests() {
  console.log('🚀 BitCurrent API Performance Tests');
  console.log('====================================\n');
  
  try {
    // Test public endpoints
    await benchmark('/markets', 'GET', null, 100);
    await benchmark('/health', 'GET', null, 100);
    
    // Test health status (more complex)
    await benchmark('/health/status', 'GET', null, 50);
    
    console.log('\n====================================');
    console.log('✅ Performance tests complete');
    console.log('\n💡 Targets:');
    console.log('  - Avg response time: < 100ms');
    console.log('  - P95: < 200ms');
    console.log('  - Error rate: < 1%');
    console.log('  - RPS: > 10 req/s');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { benchmark, runTests };

