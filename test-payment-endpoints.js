// Simple test script to verify payment endpoints
const BASE_URL = 'http://localhost:3001';

async function testPaymentEndpoints() {
  console.log('🧪 Testing Payment Endpoints...\n');

  try {
    // Test 1: Get active coupons (no auth required)
    console.log('1. Testing GET /api/payments/coupons/active');
    const couponsResponse = await fetch(`${BASE_URL}/api/payments/coupons/active`);
    const couponsData = await couponsResponse.json();
    console.log('✅ Active coupons endpoint:', couponsResponse.status, couponsData);
    console.log('');

    // Test 2: Test Stripe session endpoint (no auth required)
    console.log('2. Testing GET /api/payments/sessions/stripe/test-session-id');
    const sessionResponse = await fetch(`${BASE_URL}/api/payments/sessions/stripe/test-session-id`);
    const sessionData = await sessionResponse.json();
    console.log('✅ Stripe session endpoint:', sessionResponse.status, sessionData);
    console.log('');

    // Test 3: Test webhook endpoint (no auth required)
    console.log('3. Testing POST /api/payments/webhooks/stripe');
    const webhookResponse = await fetch(`${BASE_URL}/api/payments/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });
    console.log('✅ Webhook endpoint:', webhookResponse.status);
    console.log('');

    console.log('🎉 All basic endpoint tests completed!');
    console.log('');
    console.log('📝 Note: Auth-protected endpoints require a valid Bearer token.');
    console.log('   To test those, you need to:');
    console.log('   1. Get a valid token from Clerk');
    console.log('   2. Add Authorization: Bearer <token> header');
    console.log('   3. Test endpoints like:');
    console.log('      - POST /api/payments/sessions');
    console.log('      - GET /api/payments/enrollments');
    console.log('      - POST /api/payments/coupons/validate');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testPaymentEndpoints();
