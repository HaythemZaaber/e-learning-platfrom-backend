const axios = require('axios');

// Start Stripe Connect Onboarding Process
async function startOnboarding() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🚀 Starting Stripe Connect Onboarding Process...\n');

    // Step 1: Get the onboarding URL
    console.log('📋 Step 1: Getting onboarding URL...');
    
    // Note: Replace with your actual instructor token
    const instructorToken = 'YOUR_INSTRUCTOR_TOKEN_HERE';
    
    const linkResponse = await axios.post(
      `${baseURL}/payments/connect/accounts/links`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${instructorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (linkResponse.data.success) {
      console.log('✅ Onboarding URL created successfully!');
      console.log('🔗 Onboarding URL:', linkResponse.data.accountLink);
      
      console.log('\n📝 Next Steps:');
      console.log('1. Open the onboarding URL in your web browser');
      console.log('2. Complete all required information');
      console.log('3. Upload required documents');
      console.log('4. Accept Terms of Service');
      console.log('5. Wait for verification');
      
      console.log('\n📋 Required Information:');
      console.log('- Legal name (must match government ID)');
      console.log('- Date of birth');
      console.log('- Social Security Number (US) or equivalent');
      console.log('- Home address');
      console.log('- Phone number');
      console.log('- Bank account information');
      console.log('- Government-issued ID');
      
      console.log('\n⏰ Estimated Time: 10-15 minutes');
      console.log('✅ Verification: Usually instant, up to 3 business days');
      
    } else {
      console.log('❌ Failed to create onboarding URL:', linkResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error starting onboarding:', error.response?.data || error.message);
    
    if (error.response?.data?.error?.includes('not set up')) {
      console.log('\n🔧 Solution: Create a Stripe Connect account first');
      console.log('Run: node create-connect-account.js');
    }
  }
}

// Check onboarding status
async function checkOnboardingStatus() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('\n🔍 Checking onboarding status...');
    
    const instructorToken = 'YOUR_INSTRUCTOR_TOKEN_HERE';
    
    const statusResponse = await axios.get(
      `${baseURL}/payments/connect/accounts`,
      {
        headers: {
          'Authorization': `Bearer ${instructorToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (statusResponse.data.success) {
      const account = statusResponse.data.account;
      
      console.log('📋 Account Status:');
      console.log('ID:', account.id);
      console.log('Email:', account.email);
      console.log('Charges Enabled:', account.charges_enabled ? '✅ Yes' : '❌ No');
      console.log('Payouts Enabled:', account.payouts_enabled ? '✅ Yes' : '❌ No');
      console.log('Details Submitted:', account.details_submitted ? '✅ Yes' : '❌ No');
      
      if (account.requirements?.currently_due?.length > 0) {
        console.log('\n📝 Pending Requirements:');
        account.requirements.currently_due.forEach(req => {
          console.log(`- ${req}`);
        });
      }
      
      if (account.charges_enabled && account.payouts_enabled) {
        console.log('\n🎉 Onboarding Complete! Your account is ready for payments.');
      } else {
        console.log('\n⏳ Onboarding in progress. Please complete the required steps.');
      }
    }

  } catch (error) {
    console.error('❌ Error checking status:', error.response?.data || error.message);
  }
}

// Run the onboarding process
async function runOnboarding() {
  console.log('🚀 Stripe Connect Onboarding Helper\n');
  
  await startOnboarding();
  await checkOnboardingStatus();
  
  console.log('\n✅ Onboarding process initiated!');
  console.log('\n📚 For detailed instructions, see: STRIPE_CONNECT_ONBOARDING_GUIDE.md');
}

runOnboarding().catch(console.error);
