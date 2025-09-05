# 🔧 PaymentIntent Fix for Session Booking Payment Flow

## **🎯 Problem Description**

The session booking payment flow was failing with the error:

```
"Failed to capture payment: This PaymentIntent could not be captured because it has a status of requires_payment_method. Only a PaymentIntent with one of the following statuses may be captured: requires_capture."
```

## **🔍 Root Cause Analysis**

### **The Issue:**

1. **PaymentIntent was created separately** from the Stripe Checkout session
2. **Student never completed the payment** through the checkout process
3. **PaymentIntent status remained** `requires_payment_method` instead of `requires_capture`
4. **System tried to capture** a payment that was never authorized

### **PaymentIntent Status Flow:**

```
requires_payment_method → requires_confirmation → requires_capture → succeeded
```

The PaymentIntent was stuck at `requires_payment_method` because the student didn't complete the checkout process.

## **🔄 Original (Broken) Flow**

### **Step 1: Create PaymentIntent**

```typescript
// ❌ Created PaymentIntent separately
const paymentIntent = await this.stripe.paymentIntents.create({
  capture_method: 'manual',
  confirmation_method: 'manual',
  // Status: requires_payment_method
});
```

### **Step 2: Create Checkout Session**

```typescript
// ❌ Checkout session not linked to PaymentIntent
const session = await this.stripe.checkout.sessions.create({
  mode: 'payment',
  // No payment_intent_data
});
```

### **Step 3: Student Completes Checkout**

```typescript
// ❌ PaymentIntent status unchanged
// Still: requires_payment_method
```

### **Step 4: Try to Capture**

```typescript
// ❌ Fails because status is not requires_capture
await this.stripe.paymentIntents.capture(paymentIntentId);
```

## **✅ Fixed Flow**

### **Step 1: Create Checkout Session with PaymentIntent Data**

```typescript
// ✅ PaymentIntent created by checkout session
const session = await this.stripe.checkout.sessions.create({
  mode: 'payment',
  payment_intent_data: {
    capture_method: 'manual',
    application_fee_amount: platformFeeInCents,
    transfer_data: {
      destination: instructorStripeAccountId,
    },
    metadata: {
      bookingRequestId,
      offeringId,
      studentId,
      instructorId,
      sessionType: 'LIVE_SESSION',
    },
  },
  // PaymentIntent will be created when student completes checkout
});
```

### **Step 2: Student Completes Checkout**

```typescript
// ✅ PaymentIntent created and status updated
// Status: requires_capture (ready for manual capture)
```

### **Step 3: Retrieve PaymentIntent from Checkout Session**

```typescript
// ✅ Get PaymentIntent ID from completed checkout
const session = await this.stripe.checkout.sessions.retrieve(checkoutSessionId);
const paymentIntentId = session.payment_intent;
```

### **Step 4: Capture Payment**

```typescript
// ✅ Now works because status is requires_capture
await this.stripe.paymentIntents.capture(paymentIntentId);
```

## **🔧 Code Changes Made**

### **1. Updated Payment Service**

**Before:**

```typescript
// Create PaymentIntent separately
const paymentIntent = await this.stripe.paymentIntents.create({
  capture_method: 'manual',
  confirmation_method: 'manual',
});

// Create Checkout Session separately
const session = await this.stripe.checkout.sessions.create({
  mode: 'payment',
});
```

**After:**

```typescript
// Create Checkout Session with PaymentIntent data
const session = await this.stripe.checkout.sessions.create({
  mode: 'payment',
  payment_intent_data: {
    capture_method: 'manual',
    application_fee_amount: platformFeeInCents,
    transfer_data: {
      destination: instructorStripeAccountId,
    },
  },
});
```

### **2. Added PaymentIntent Retrieval Method**

```typescript
async getPaymentIntentFromCheckoutSession(checkoutSessionId: string) {
  const session = await this.stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (!session.payment_intent) {
    throw new BadRequestException('No PaymentIntent found for this checkout session');
  }

  const paymentIntent = await this.stripe.paymentIntents.retrieve(session.payment_intent as string);

  return {
    success: true,
    paymentIntent: {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    }
  };
}
```

### **3. Enhanced Payment Capture with Status Validation**

```typescript
async captureSessionPayment(paymentIntentId: string) {
  // First, retrieve the payment intent to check its status
  const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'requires_capture') {
    throw new BadRequestException(
      `PaymentIntent cannot be captured. Current status: ${paymentIntent.status}. Expected status: requires_capture`
    );
  }

  const capturedPayment = await this.stripe.paymentIntents.capture(paymentIntentId);
  return {
    success: true,
    paymentIntent: capturedPayment
  };
}
```

### **4. Updated Session Booking Service**

**Before:**

```typescript
// PaymentIntent ID set immediately (but was null)
paymentIntentId: paymentResult.paymentIntent!.id,
```

**After:**

```typescript
// PaymentIntent ID will be updated when payment is completed
paymentIntentId: null, // Will be updated when payment is completed
```

### **5. Enhanced Session Confirmation**

```typescript
// Get PaymentIntent from checkout session if not already set
let paymentIntentId = dto.paymentIntentId;
if (!paymentIntentId && bookingRequest.stripeSessionId) {
  const paymentIntentResult =
    await this.paymentService.getPaymentIntentFromCheckoutSession(
      bookingRequest.stripeSessionId,
    );

  if (paymentIntentResult.success) {
    paymentIntentId = paymentIntentResult.paymentIntent!.id;

    // Update booking request with PaymentIntent ID
    await this.prisma.bookingRequest.update({
      where: { id: dto.bookingId },
      data: { paymentIntentId: paymentIntentId },
    });
  }
}

// Verify payment intent status
if (paymentIntentId) {
  const paymentIntentResult =
    await this.paymentService.getPaymentIntentFromCheckoutSession(
      bookingRequest.stripeSessionId!,
    );

  if (paymentIntentResult.success) {
    const status = paymentIntentResult.paymentIntent!.status;
    if (status !== 'requires_capture') {
      throw new BadRequestException(
        `Payment is not ready for capture. Current status: ${status}. Expected: requires_capture`,
      );
    }
  }
}
```

## **📊 Payment Flow Comparison**

### **Before (Broken):**

```
1. Create PaymentIntent (requires_payment_method)
2. Create Checkout Session (unlinked)
3. Student completes checkout (PaymentIntent unchanged)
4. Try to capture (fails - wrong status)
```

### **After (Fixed):**

```
1. Create Checkout Session with payment_intent_data
2. Student completes checkout (PaymentIntent created with requires_capture)
3. Retrieve PaymentIntent from checkout session
4. Capture payment (succeeds - correct status)
```

## **🚨 Error Handling Improvements**

### **Status Validation:**

- Check PaymentIntent status before capture
- Provide clear error messages for different states
- Handle cases where payment was never completed

### **Error Scenarios:**

```typescript
// Payment not completed
if (status === 'requires_payment_method') {
  throw new BadRequestException(
    'Payment not completed. Student must complete checkout first.',
  );
}

// Payment already captured
if (status === 'succeeded') {
  throw new BadRequestException('Payment already captured.');
}

// Payment canceled
if (status === 'canceled') {
  throw new BadRequestException('Payment was canceled.');
}
```

## **✅ Verification Steps**

### **1. Booking Creation:**

- ✅ Checkout session created with `payment_intent_data`
- ✅ PaymentIntent ID initially null
- ✅ Student gets checkout URL

### **2. Payment Completion:**

- ✅ Student completes checkout
- ✅ PaymentIntent created with `requires_capture` status
- ✅ PaymentIntent linked to checkout session

### **3. Session Confirmation:**

- ✅ PaymentIntent retrieved from checkout session
- ✅ PaymentIntent ID updated in booking request
- ✅ Status validated as `requires_capture`

### **4. Session Completion:**

- ✅ Payment captured successfully
- ✅ Money transferred to instructor
- ✅ All payment statuses updated to PAID

## **🔍 Testing**

### **Test Cases:**

1. **Complete Payment Flow** - End-to-end test
2. **Payment Status Validation** - Check all status transitions
3. **Error Handling** - Test various error scenarios
4. **Edge Cases** - Test incomplete payments, cancellations

### **Test Script:**

```bash
node test-corrected-payment-flow.js
```

## **📝 Key Takeaways**

1. **PaymentIntent should be created by Stripe Checkout** for better integration
2. **Always validate PaymentIntent status** before capture
3. **Retrieve PaymentIntent from checkout session** after payment completion
4. **Provide clear error messages** for different payment states
5. **Handle the complete payment lifecycle** properly

---

**Status**: ✅ **FIXED**
**Impact**: High (fixes core payment functionality)
**Testing**: Comprehensive test suite provided
