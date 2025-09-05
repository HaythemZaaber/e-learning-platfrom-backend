# 💳 Payment Logic Summary & Data Flow Fixes

## **🎯 Payment Concepts Explained**

### **1. Payment Intent**

A **Payment Intent** is Stripe's representation of a payment request. Think of it as a "payment promise" that can be in different states:

```typescript
// Payment Intent States:
'requires_payment_method'; // Waiting for payment method
'requires_confirmation'; // Ready to confirm
'requires_action'; // Requires 3D Secure, etc.
'processing'; // Payment is being processed
'requires_capture'; // ✅ Payment authorized, waiting to capture
'canceled'; // Payment was canceled
'succeeded'; // ✅ Payment completed
```

### **2. Manual Capture vs Automatic Capture**

- **Automatic Capture**: Money charged immediately when payment succeeds
- **Manual Capture**: ✅ Money authorized but held until you decide to capture it

### **3. Payout**

A **Payout** is when money is transferred from your Stripe account to your bank account (or to connected accounts).

## **🔄 Complete Payment Flow for Live Sessions**

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

## **🔧 Data Flow Fixes Applied**

### **Issue 1: Incorrect Payment Status Updates**

**Problem:** Payment status was being set to `PAID` immediately after session confirmation, but should remain `PENDING` until session completion.

**Before:**

```typescript
// In confirmSessionBooking method
await this.prisma.bookingRequest.update({
  data: {
    paymentStatus: PaymentStatus.PAID, // ❌ Wrong!
  },
});

// In createLiveSessionFromBooking method
await this.prisma.sessionReservation.create({
  data: {
    paymentStatus: 'PAID', // ❌ Wrong!
  },
});
```

**After:**

```typescript
// In confirmSessionBooking method
await this.prisma.bookingRequest.update({
  data: {
    paymentStatus: PaymentStatus.PENDING, // ✅ Correct!
  },
});

// In createLiveSessionFromBooking method
await this.prisma.sessionReservation.create({
  data: {
    paymentStatus: PaymentStatus.PENDING, // ✅ Correct!
  },
});
```

### **Issue 2: Session Completion Logic**

**Problem:** Session completion was only allowed from `IN_PROGRESS` status, but sessions should be `SCHEDULED` before completion.

**Before:**

```typescript
if (session.status !== SessionStatus.IN_PROGRESS) {
  throw new BadRequestException('Session is not in progress');
}
```

**After:**

```typescript
if (
  session.status !== SessionStatus.SCHEDULED &&
  session.status !== SessionStatus.IN_PROGRESS
) {
  throw new BadRequestException(
    'Session is not in a state that can be completed',
  );
}
```

### **Issue 3: Payment Capture Logic**

**Problem:** Payment capture wasn't properly updating all related payment statuses.

**Before:**

```typescript
// Only updated session payout status
await this.prisma.liveSession.update({
  data: { payoutStatus: PayoutStatus.PENDING },
});
```

**After:**

```typescript
// Update all payment statuses
await this.prisma.bookingRequest.update({
  data: { paymentStatus: PaymentStatus.PAID },
});

await this.prisma.sessionReservation.updateMany({
  data: { paymentStatus: PaymentStatus.PAID },
});

await this.prisma.liveSession.update({
  data: { payoutStatus: PayoutStatus.PENDING },
});
```

### **Issue 4: Enum Usage**

**Problem:** String literals were used instead of Prisma enums.

**Before:**

```typescript
sessionType: 'CUSTOM',
sessionMode: 'LIVE',
status: 'SCHEDULED',
role: 'STUDENT',
paymentStatus: 'PENDING'
```

**After:**

```typescript
sessionType: LiveSessionType.CUSTOM,
sessionMode: SessionMode.LIVE,
status: SessionStatus.SCHEDULED,
role: ParticipantRole.STUDENT,
paymentStatus: PaymentStatus.PENDING
```

## **📊 Correct Payment States**

### **BookingRequest Payment States:**

1. **PENDING** → When booking is created (payment authorized)
2. **PENDING** → When session is confirmed (still not captured)
3. **PAID** → When session is completed (payment captured)

### **SessionReservation Payment States:**

1. **PENDING** → When reservation is created
2. **PENDING** → When session is confirmed
3. **PAID** → When session is completed

### **LiveSession Payout States:**

1. **PENDING** → When session is completed (payout initiated)
2. **PROCESSING** → When payout is being processed
3. **COMPLETED** → When payout is successful

## **🔍 Verification Points**

### **After Booking Creation:**

- ✅ `BookingRequest.paymentStatus = PENDING`
- ✅ `PaymentIntent.status = requires_capture`
- ✅ Money authorized but not captured

### **After Session Confirmation:**

- ✅ `BookingRequest.paymentStatus = PENDING` (still)
- ✅ `SessionReservation.paymentStatus = PENDING`
- ✅ `LiveSession.status = SCHEDULED`
- ✅ Payment still not captured

### **After Session Completion:**

- ✅ `BookingRequest.paymentStatus = PAID`
- ✅ `SessionReservation.paymentStatus = PAID`
- ✅ `LiveSession.payoutStatus = PENDING`
- ✅ Payment captured and transferred

## **🚨 Error Handling**

### **Payment Authorization Fails:**

- Booking request is **deleted**
- Student is **not charged**
- Error message shown to student

### **Session Cancellation:**

- Payment is **refunded** to student
- No money moves to instructor
- Booking status becomes `CANCELLED`

### **Instructor Rejects Booking:**

- Payment is **refunded** to student
- No money moves to instructor
- Booking status becomes `REJECTED`

## **📱 User Experience**

### **Student Journey:**

1. **Browse** available sessions
2. **Book** and pay immediately
3. **Receive** confirmation and meeting link
4. **Attend** session
5. **Get** receipt after completion

### **Instructor Journey:**

1. **Set up** Stripe Connect account
2. **Create** session offerings
3. **Receive** booking notifications
4. **Conduct** sessions
5. **Get paid** automatically after completion

## **✅ Summary of Fixes**

1. **Fixed payment status flow** - PENDING → PAID (after capture)
2. **Fixed session completion logic** - Allow completion from SCHEDULED status
3. **Fixed payment capture** - Update all related payment statuses
4. **Fixed enum usage** - Use Prisma enums instead of string literals
5. **Fixed UUID validation** - Removed UUID validation from URL parameters

---

**Key Takeaway**: The payment system now correctly holds money until service delivery, ensuring fair payment for both students and instructors while generating platform revenue.
