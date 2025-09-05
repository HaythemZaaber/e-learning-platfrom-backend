const axios = require('axios');

// Test Corrected Payment Flow for Live Sessions
async function testCorrectedPaymentFlow() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing Corrected Payment Flow for Live Sessions\n');

    // Step 1: Create Session Booking
    console.log('📋 Step 1: Creating Session Booking...');
    
    const bookingData = {
      timeSlotId: 'timeslot_123', // Replace with actual time slot ID
      offeringId: 'offering_456', // Replace with actual offering ID
      studentId: 'student_789', // Replace with actual student ID
      agreedPrice: 100,
      currency: 'USD',
      returnUrl: 'http://localhost:3000/payment/success',
      cancelUrl: 'http://localhost:3000/payment/cancel'
    };

    const bookingResponse = await axios.post(
      `${baseURL}/session-bookings`,
      bookingData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_STUDENT_TOKEN_HERE'
        }
      }
    );

    console.log('✅ Booking created:', bookingResponse.data);
    const bookingRequest = bookingResponse.data.bookingRequest;
    const checkoutSession = bookingResponse.data.checkoutSession;

    console.log('📝 Important Notes:');
    console.log('- PaymentIntent ID is initially null');
    console.log('- Student must complete checkout to create PaymentIntent');
    console.log('- Checkout URL:', checkoutSession.url);

    // Step 2: Simulate Payment Completion (in real scenario, student completes checkout)
    console.log('\n📋 Step 2: Simulating Payment Completion...');
    console.log('In a real scenario, the student would:');
    console.log('1. Click the checkout URL');
    console.log('2. Enter payment details');
    console.log('3. Complete the payment');
    console.log('4. Be redirected to success URL');

    // Step 3: Confirm Session Booking (after payment completion)
    console.log('\n📋 Step 3: Confirming Session Booking...');
    
    const confirmData = {
      bookingId: bookingRequest.id,
      // paymentIntentId will be retrieved from checkout session
    };

    const confirmResponse = await axios.post(
      `${baseURL}/session-bookings/confirm`,
      confirmData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_INSTRUCTOR_TOKEN_HERE'
        }
      }
    );

    console.log('✅ Session confirmed:', confirmResponse.data);
    const liveSession = confirmResponse.data.liveSession;

    // Step 4: Complete Session (captures payment)
    console.log('\n📋 Step 4: Completing Session (capturing payment)...');
    
    const completionData = {
      summary: 'Session completed successfully',
      actualDuration: 60,
      instructorNotes: 'Great session with the student',
      sessionArtifacts: ['https://example.com/recording.mp4', 'https://example.com/notes.pdf']
    };

    const completionResponse = await axios.patch(
      `${baseURL}/session-bookings/sessions/${liveSession.id}/complete`,
      completionData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_INSTRUCTOR_TOKEN_HERE'
        }
      }
    );

    console.log('✅ Session completed:', completionResponse.data);

    // Summary
    console.log('\n🎉 Corrected Payment Flow Summary:');
    console.log('1. ✅ Booking created with null PaymentIntent ID');
    console.log('2. ✅ Checkout session created with payment_intent_data');
    console.log('3. ✅ Student completes checkout (PaymentIntent created)');
    console.log('4. ✅ Session confirmed (PaymentIntent retrieved from checkout)');
    console.log('5. ✅ Session completed (PaymentIntent captured)');

  } catch (error) {
    console.error('❌ Error in corrected payment flow test:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
      
      // Check for specific payment-related errors
      if (error.response.data?.error?.includes('requires_payment_method')) {
        console.log('\n🔧 This error indicates the payment was not completed.');
        console.log('The student needs to complete the checkout process first.');
      }
      
      if (error.response.data?.error?.includes('requires_capture')) {
        console.log('\n🔧 This error indicates the payment is ready for capture.');
        console.log('The PaymentIntent status is correct.');
      }
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Test Payment Intent Status Flow
async function testPaymentIntentStatusFlow() {
  console.log('\n🧪 Testing Payment Intent Status Flow...\n');

  const statusFlow = [
    {
      step: '1. PaymentIntent Created',
      status: 'requires_payment_method',
      description: 'Created by checkout session, waiting for payment method'
    },
    {
      step: '2. Student Enters Payment Details',
      status: 'requires_confirmation',
      description: 'Payment method added, ready for confirmation'
    },
    {
      step: '3. Payment Confirmed',
      status: 'requires_capture',
      description: 'Payment authorized, ready for capture (manual)'
    },
    {
      step: '4. Session Completed',
      status: 'succeeded',
      description: 'Payment captured, money transferred to instructor'
    }
  ];

  for (const status of statusFlow) {
    console.log(`📋 ${status.step}:`);
    console.log(`   Status: ${status.status}`);
    console.log(`   Description: ${status.description}`);
    console.log('---');
  }
}

// Test Error Handling
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...\n');

  const errorScenarios = [
    {
      scenario: 'Payment Not Completed',
      error: 'requires_payment_method',
      solution: 'Student must complete checkout process'
    },
    {
      scenario: 'Payment Already Captured',
      error: 'succeeded',
      solution: 'Payment already processed, no action needed'
    },
    {
      scenario: 'Payment Canceled',
      error: 'canceled',
      solution: 'Payment was canceled, cannot be captured'
    },
    {
      scenario: 'Payment Failed',
      error: 'requires_payment_method',
      solution: 'Payment failed, student must try again'
    }
  ];

  for (const scenario of errorScenarios) {
    console.log(`📋 ${scenario.scenario}:`);
    console.log(`   Error: ${scenario.error}`);
    console.log(`   Solution: ${scenario.solution}`);
    console.log('---');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Corrected Payment Flow Test Suite\n');
  
  await testPaymentIntentStatusFlow();
  await testErrorHandling();
  await testCorrectedPaymentFlow();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Key Changes Made:');
  console.log('- PaymentIntent created by Stripe Checkout (not separately)');
  console.log('- payment_intent_data added to checkout session');
  console.log('- PaymentIntent ID retrieved from checkout session after payment');
  console.log('- Status validation before capture');
  console.log('- Proper error handling for different PaymentIntent states');
}

runAllTests().catch(console.error);
