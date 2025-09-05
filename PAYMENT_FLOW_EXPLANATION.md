# 💳 Live Session Payment Flow Complete Guide

## **🎯 Overview**

The live session payment system uses **Stripe Connect** with **manual capture** to ensure:

1. **Student pays immediately** when booking
2. **Money is held** by the platform until session completion
3. **Instructor gets paid** only after session is marked as complete
4. **Platform takes a fee** from each transaction

## **🔄 Step-by-Step Payment Flow**

### **Step 1: Student Books Session**

```
Student → Books Time Slot → Creates Booking Request
```

**What happens:**

- Student selects available time slot
- System creates `BookingRequest` with `PENDING` status
- System creates `PaymentIntent` with `manual_capture`
- Student pays immediately via Stripe Checkout
- Payment is **authorized but not captured**

### **Step 2: Payment Authorization**

```
Stripe → Authorizes Payment → Holds Money
```

**Payment Intent State:** `requires_capture`

- Money is **authorized** (held by Stripe)
- **Not yet transferred** to instructor
- Student's card is charged but can be refunded
- Platform holds the money temporarily

### **Step 3: Session Confirmation**

```
Instructor → Approves Booking → Creates Live Session
```

**What happens:**

- Instructor approves the booking
- System creates `LiveSession` record
- `BookingRequest` status becomes `ACCEPTED`
- Payment remains **authorized but not captured**

### **Step 4: Session Execution**

```
Instructor + Student → Conduct Live Session
```

**What happens:**

- Session takes place via Jitsi
- Both parties participate
- Session is recorded (if enabled)
- No payment movement yet

### **Step 5: Session Completion**

```
Instructor → Marks Session Complete → Captures Payment
```

**What happens:**

- Instructor marks session as `COMPLETED`
- System **captures the payment** (transfers money)
- Money moves from platform to instructor's Stripe account
- Platform fee is deducted automatically
- `PaymentIntent` state becomes `succeeded`

### **Step 6: Payout Processing**

```
Stripe → Transfers Money → Instructor's Bank Account
```

**What happens:**

- Instructor's Stripe account receives the payment
- Money is automatically transferred to instructor's bank account
- Platform fee remains in platform's account

## **💰 Payment Breakdown Example**

### **Session Price: $100**

```
Student Payment: $100
├── Platform Fee (20%): $20
└── Instructor Payout (80%): $80
```

### **Flow:**

1. **Student pays:** $100 to platform
2. **Platform holds:** $100 (authorized)
3. **Session completes:** Platform captures $100
4. **Platform keeps:** $20 (fee)
5. **Instructor receives:** $80 (via Stripe Connect)

## **🔧 Technical Implementation**

### **Payment Intent Creation**

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00 in cents
  currency: 'usd',
  application_fee_amount: 2000, // $20.00 platform fee
  transfer_data: {
    destination: instructorStripeAccountId, // Where money goes
  },
  capture_method: 'manual', // Don't capture immediately
  metadata: {
    bookingRequestId: 'booking_123',
    sessionType: 'LIVE_SESSION',
  },
});
```

### **Payment Capture**

```typescript
const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId, {
  amount_to_capture: 10000, // Capture the full amount
});
```

## **📊 Database Records**

### **BookingRequest**

```typescript
{
  id: 'booking_123',
  status: 'ACCEPTED',
  paymentStatus: 'PENDING', // Until captured
  paymentIntentId: 'pi_1234567890',
  finalPrice: 100,
  currency: 'USD'
}
```

### **LiveSession**

```typescript
{
  id: 'session_456',
  status: 'COMPLETED',
  totalPrice: 100,
  platformFee: 20,
  instructorPayout: 80,
  paymentStatus: 'CAPTURED'
}
```

### **InstructorPayout**

```typescript
{
  id: 'payout_789',
  instructorId: 'instructor_123',
  amount: 80,
  platformFee: 20,
  status: 'PROCESSING',
  stripePayoutId: 'po_1234567890'
}
```

## **🚨 Error Handling**

### **Payment Authorization Fails**

- Booking request is **deleted**
- Student is **not charged**
- Error message shown to student

### **Session Cancellation**

- Payment is **refunded** to student
- No money moves to instructor
- Booking status becomes `CANCELLED`

### **Instructor Rejects Booking**

- Payment is **refunded** to student
- No money moves to instructor
- Booking status becomes `REJECTED`

### **Session No-Show**

- Instructor can mark as **no-show**
- Payment can be **partially refunded**
- Platform fee may still apply

## **⚙️ Configuration**

### **Platform Fee**

```typescript
const platformFeePercent = 0.2; // 20%
const platformFeeAmount = sessionPrice * platformFeePercent;
const instructorPayout = sessionPrice - platformFeeAmount;
```

### **Payment Settings**

```typescript
const paymentSettings = {
  captureMethod: 'manual', // Hold payment until completion
  applicationFeeAmount: platformFeeAmount,
  transferData: {
    destination: instructorStripeAccountId,
  },
};
```

## **🔍 Monitoring & Analytics**

### **Payment States to Track**

- `PENDING`: Payment authorized, waiting for capture
- `CAPTURED`: Payment transferred to instructor
- `REFUNDED`: Payment returned to student
- `FAILED`: Payment authorization failed

### **Key Metrics**

- **Conversion Rate**: Bookings that result in completed payments
- **Completion Rate**: Sessions that are marked as completed
- **Refund Rate**: Payments that are refunded
- **Platform Revenue**: Total fees collected

## **🛡️ Security & Compliance**

### **Fraud Prevention**

- Payment authorization before session creation
- Manual capture prevents automatic charges
- Refund policies for disputes
- Session verification before payout

### **Regulatory Compliance**

- Proper fee disclosure to students
- Clear refund policies
- Tax reporting for platform fees
- Instructor payment documentation

## **📱 User Experience**

### **Student Journey**

1. **Browse** available sessions
2. **Book** and pay immediately
3. **Receive** confirmation and meeting link
4. **Attend** session
5. **Get** receipt after completion

### **Instructor Journey**

1. **Set up** Stripe Connect account
2. **Create** session offerings
3. **Receive** booking notifications
4. **Conduct** sessions
5. **Get paid** automatically after completion

---

**Key Takeaway**: The system ensures **fair payment** by holding money until service delivery, protecting both students and instructors while generating platform revenue.
