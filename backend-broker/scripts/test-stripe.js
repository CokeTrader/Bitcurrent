/**
 * Test Stripe integration manually
 * Run: node scripts/test-stripe.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  console.log('🧪 Testing Stripe integration...\n');

  try {
    // 1. Test API connection
    console.log('1. Testing API connection...');
    const balance = await stripe.balance.retrieve();
    console.log('✅ Connected! Available: £' + (balance.available[0].amount / 100));

    // 2. Create test checkout session
    console.log('\n2. Creating test checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'BitCurrent Deposit',
            description: 'Add funds to your BitCurrent account',
          },
          unit_amount: 1000, // £10
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://bitcurrent.vercel.app/dashboard?deposit=success',
      cancel_url: 'https://bitcurrent.vercel.app/deposit?cancelled=true',
      metadata: {
        userId: 'test-user-123',
        type: 'deposit'
      }
    });
    
    console.log('✅ Session created!');
    console.log('   ID:', session.id);
    console.log('   URL:', session.url);

    // 3. List recent events
    console.log('\n3. Recent events:');
    const events = await stripe.events.list({ limit: 5 });
    events.data.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.type} (${new Date(event.created * 1000).toLocaleTimeString()})`);
    });

    console.log('\n✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Add STRIPE_SECRET_KEY to Railway');
    console.log('   2. Set up webhook endpoint');
    console.log('   3. Test real deposit flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Fix: Set STRIPE_SECRET_KEY environment variable');
      console.log('   Get it from: https://dashboard.stripe.com/apikeys');
    }
  }
}

testStripe();


