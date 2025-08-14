// Test file for enrollment-based access system
// This demonstrates how users must enroll to access both free and paid courses

const API_BASE_URL = 'http://localhost:3000/api/payments';

// Example usage of the new free enrollment endpoints

// 1. Validate if a course can be enrolled for free
async function validateFreeCourseEnrollment(courseId, authToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/free/validate/${courseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Free course validation result:', result);
    return result;
  } catch (error) {
    console.error('Error validating free course enrollment:', error);
    return null;
  }
}

// 2. Enroll in a free course to unlock content
async function enrollInFreeCourse(courseId, authToken, notes = 'Free course enrollment') {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/free`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        notes,
      }),
    });

    const result = await response.json();
    console.log('Free course enrollment result:', result);
    return result;
  } catch (error) {
    console.error('Error enrolling in free course:', error);
    return null;
  }
}

// 3. Use the existing payment session endpoint (handles both free and paid courses)
async function createPaymentSession(courseId, authToken, couponCode = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        couponCode,
        returnUrl: 'http://localhost:3000/payment/success',
        cancelUrl: 'http://localhost:3000/payment/cancel',
        metadata: {
          notes: 'Course enrollment',
        },
      }),
    });

    const result = await response.json();
    console.log('Payment session result:', result);
    return result;
  } catch (error) {
    console.error('Error creating payment session:', error);
    return null;
  }
}

// Example usage scenarios

// Scenario 1: User wants to enroll in a free course to unlock content
async function enrollInFreeCourseExample() {
  const courseId = 'free-course-123';
  const authToken = 'user-auth-token';

  console.log('=== Free Course Enrollment Example ===');
  
  // Step 1: Validate the course can be enrolled for free
  const validation = await validateFreeCourseEnrollment(courseId, authToken);
  
  if (validation && validation.canEnroll) {
    console.log('✅ Course is available for free enrollment');
    
    // Step 2: Enroll to unlock content
    const enrollment = await enrollInFreeCourse(courseId, authToken, 'Enrolled to unlock content');
    
    if (enrollment && enrollment.success) {
      console.log('✅ Successfully enrolled in free course');
      console.log('✅ Course content is now unlocked');
      console.log('Enrollment details:', enrollment.enrollment);
    } else {
      console.log('❌ Failed to enroll in free course');
    }
  } else {
    console.log('❌ Course cannot be enrolled for free:', validation?.error);
  }
}

// Scenario 2: User tries to use payment session for free course
async function paymentSessionForFreeCourseExample() {
  const courseId = 'free-course-123';
  const authToken = 'user-auth-token';

  console.log('\n=== Payment Session for Free Course Example ===');
  
  // This will automatically create enrollment for free courses
  const result = await createPaymentSession(courseId, authToken);
  
  if (result && result.success) {
    if (result.isFreeCourse) {
      console.log('✅ Free course enrollment created automatically');
      console.log('✅ Course content is now unlocked');
      console.log('Enrollment details:', result.enrollment);
    } else {
      console.log('✅ Payment session created for paid course');
      console.log('Redirect URL:', result.redirectUrl);
    }
  } else {
    console.log('❌ Failed to create payment session:', result?.error);
  }
}

// Scenario 3: User tries to enroll in a paid course for free
async function paidCourseEnrollmentExample() {
  const courseId = 'paid-course-123';
  const authToken = 'user-auth-token';

  console.log('\n=== Paid Course Enrollment Example ===');
  
  // This should fail validation
  const validation = await validateFreeCourseEnrollment(courseId, authToken);
  
  if (validation && !validation.canEnroll) {
    console.log('❌ Expected error for paid course:', validation.error);
    
    // Try to enroll anyway (should fail)
    const enrollment = await enrollInFreeCourse(courseId, authToken);
    console.log('Enrollment attempt result:', enrollment);
  }
}

// Run examples
async function runExamples() {
  console.log('🚀 Testing Free Course Enrollment System\n');
  
  await enrollInFreeCourseExample();
  await paymentSessionForFreeCourseExample();
  await paidCourseEnrollmentExample();
  
  console.log('\n✨ Free course enrollment system test completed!');
}

// Export functions for use in other files
module.exports = {
  validateFreeCourseEnrollment,
  enrollInFreeCourse,
  createPaymentSession,
  runExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
