/**
 * Load testing script
 * Simulate multiple concurrent users
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

async function simulateUser(userId) {
  const actions = [];
  
  try {
    // Simulate user journey
    // 1. Check markets
    const markets = await axios.get(`${BASE_URL}/markets`);
    actions.push({ action: 'view_markets', success: true });
    
    // 2. Get BTC quote
    await axios.get(`${BASE_URL}/markets/BTC-GBP/quote`);
    actions.push({ action: 'get_quote', success: true });
    
    // 3. Check balance (would need auth)
    // await axios.get(`${BASE_URL}/balance`, { headers: { Authorization: `Bearer ${token}` }});
    // actions.push({ action: 'check_balance', success: true });
    
    // Wait random time (1-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 4000));
    
    return { userId, actions, success: true };
  } catch (error) {
    return { userId, actions, success: false, error: error.message };
  }
}

async function loadTest(concurrentUsers = 10, duration = 60) {
  console.log('🔥 BitCurrent Load Test');
  console.log('========================\n');
  console.log(`Concurrent Users: ${concurrentUsers}`);
  console.log(`Duration: ${duration} seconds\n`);
  
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  
  const userPromises = [];
  
  // Spawn concurrent users
  for (let i = 0; i < concurrentUsers; i++) {
    userPromises.push(
      (async () => {
        let iterations = 0;
        
        while (Date.now() < endTime) {
          const result = await simulateUser(i);
          iterations++;
          totalRequests += result.actions.length;
          
          if (result.success) {
            successfulRequests += result.actions.length;
          } else {
            failedRequests += result.actions.length;
          }
        }
        
        return iterations;
      })()
    );
  }
  
  // Wait for all users to complete
  const iterations = await Promise.all(userPromises);
  const actualDuration = (Date.now() - startTime) / 1000;
  
  console.log('\n📊 Load Test Results:');
  console.log('=====================\n');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successfulRequests}`);
  console.log(`Failed: ${failedRequests}`);
  console.log(`Success Rate: ${((successfulRequests/totalRequests)*100).toFixed(2)}%`);
  console.log(`Duration: ${actualDuration.toFixed(2)}s`);
  console.log(`RPS: ${(totalRequests/actualDuration).toFixed(2)} req/s`);
  console.log(`Avg iterations per user: ${(iterations.reduce((a,b) => a+b, 0) / concurrentUsers).toFixed(2)}`);
  
  console.log('\n✅ Load test complete');
  console.log('\n💡 Targets:');
  console.log('  - Success rate: > 99%');
  console.log('  - RPS: > 100 req/s (for 10 users)');
  console.log('  - No server crashes');
}

// Run if called directly
if (require.main === module) {
  const users = parseInt(process.argv[2]) || 10;
  const duration = parseInt(process.argv[3]) || 60;
  
  loadTest(users, duration);
}

module.exports = { loadTest, simulateUser };

