# Payment & Enrollment System Implementation

## Overview

This document provides comprehensive documentation for the payment and enrollment system implemented in the e-learning platform. The system includes Stripe payment processing, coupon management, enrollment tracking, and secure payment flows.

## 🏗️ Architecture

```
Frontend (Next.js) ←→ REST API Routes ←→ NestJS Backend ←→ Stripe API
                              ↓
                        PostgreSQL Database (Prisma)
```

## 📋 Features Implemented

### ✅ Payment System

- **Stripe Integration**: Complete Stripe Checkout Session implementation
- **Payment Sessions**: Track payment state and metadata
- **Webhook Handling**: Automatic payment confirmation and enrollment
- **Payment Cancellation**: Cancel pending payment sessions
- **Error Handling**: Comprehensive error handling and logging

### ✅ Coupon System

- **Coupon Validation**: Real-time coupon code validation
- **Multiple Discount Types**: Percentage and fixed amount discounts
- **Usage Limits**: Maximum uses and current usage tracking
- **Validity Periods**: Start and end date validation
- **Course Restrictions**: Apply coupons to specific courses
- **Minimum Amount**: Enforce minimum purchase amounts

### ✅ Enrollment System

- **Automatic Enrollment**: Enroll users after successful payment
- **Free Enrollment**: Support for free course enrollments
- **Enrollment Tracking**: Track enrollment status and progress
- **Duplicate Prevention**: Prevent duplicate enrollments
- **Enrollment Analytics**: Track enrollment counts and metrics

### ✅ Security Features

- **Authentication**: JWT-based authentication with Clerk
- **Authorization**: Role-based access control
- **Webhook Verification**: Stripe webhook signature verification
- **Input Validation**: Comprehensive DTO validation
- **Error Handling**: Secure error responses

## 🔧 API Endpoints

### Payment Sessions

| Method | Endpoint                                  | Description                   | Auth Required |
| ------ | ----------------------------------------- | ----------------------------- | ------------- |
| POST   | `/api/payments/sessions`                  | Create payment session        | ✅            |
| GET    | `/api/payments/sessions/:id`              | Get payment session           | ✅            |
| GET    | `/api/payments/sessions/stripe/:stripeId` | Get payment session by Stripe | ❌            |
| POST   | `/api/payments/sessions/:id/cancel`       | Cancel payment session        | ✅            |

### Coupons

| Method | Endpoint                         | Description          | Auth Required |
| ------ | -------------------------------- | -------------------- | ------------- |
| POST   | `/api/payments/coupons/validate` | Validate coupon code | ✅            |
| GET    | `/api/payments/coupons/active`   | Get active coupons   | ❌            |

### Enrollments

| Method | Endpoint                                     | Description           | Auth Required |
| ------ | -------------------------------------------- | --------------------- | ------------- |
| POST   | `/api/payments/enrollments`                  | Create enrollment     | ✅            |
| GET    | `/api/payments/enrollments`                  | Get user enrollments  | ✅            |
| GET    | `/api/payments/enrollments/course/:courseId` | Get course enrollment | ✅            |

### Webhooks

| Method | Endpoint                        | Description            | Auth Required |
| ------ | ------------------------------- | ---------------------- | ------------- |
| POST   | `/api/payments/webhooks/stripe` | Stripe webhook handler | ❌            |

## 🗄️ Database Schema

The payment system uses the existing Prisma schema with the following key models:

### PaymentSession

```prisma
model PaymentSession {
  id              String               @id @default(cuid())
  courseId        String
  userId          String
  status          PaymentSessionStatus @default(PENDING)
  amount          Int // Amount in cents
  currency        String               @default("USD")
  paymentIntentId String?              @unique
  enrollmentId    String?
  metadata        Json                 @default("{}")
  stripeSessionId String?              @unique
  stripeCustomerId String?
  couponCode      String?
  discountAmount  Int                  @default(0)
  finalAmount     Int
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  expiresAt       DateTime?

  // Relations
  course     Course      @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  enrollment Enrollment? @relation(fields: [enrollmentId], references: [id], onDelete: SetNull)
}
```

### Coupon

```prisma
model Coupon {
  id               String       @id @default(cuid())
  code             String       @unique
  name             String
  description      String?
  discountType     DiscountType @default(PERCENTAGE)
  discountValue    Float
  currency         String       @default("USD")
  maxUses          Int?
  currentUses      Int          @default(0)
  isActive         Boolean      @default(true)
  validFrom        DateTime?
  validUntil       DateTime?
  minimumAmount    Int?
  maximumDiscount  Int?
  applicableCourses String[]    @default([])
  metadata         Json         @default("{}")
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}
```

### Enrollment

```prisma
model Enrollment {
  id                    String           @id @default(cuid())
  userId                String
  courseId              String
  enrolledAt            DateTime         @default(now())
  completedAt           DateTime?
  status                EnrollmentStatus @default(ACTIVE)
  progress              Float            @default(0)
  currentLectureId      String?
  enrollmentSource      EnrollmentSource @default(DIRECT)
  completedLectures     Int              @default(0)
  totalLectures         Int              @default(0)
  paymentStatus         PaymentStatus    @default(FREE)
  paymentId             String?
  amountPaid            Float?
  discountApplied       Float?           @default(0)
  totalTimeSpent        Int              @default(0)
  streakDays            Int              @default(0)
  lastAccessedAt        DateTime?
  certificateEarned     Boolean          @default(false)
  certificateEarnedAt   DateTime?
  type                  EnrollmentType   @default(FREE)
  source                EnrollmentSource @default(DIRECT)
  amount                Float            @default(0)
  currency              String           @default("USD")
  paidAt                DateTime?
  expiresAt             DateTime?
  notes                 String?
  completionPercentage  Float            @default(0)

  // Relations
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  paymentSessions PaymentSession[]

  @@unique([userId, courseId])
}
```

## 🔐 Authentication

The payment system uses a dual authentication approach:

### GraphQL Authentication (Existing)

- Uses `AuthGuard` for GraphQL operations
- Works with existing GraphQL resolvers
- No changes to existing GraphQL functionality

### REST API Authentication (New)

- Uses `RestAuthGuard` for REST API operations
- Compatible with Clerk authentication
- Supports Bearer token authentication
- Automatically syncs users to database

## 💳 Stripe Integration

### Payment Flow

1. **Create Payment Session**: User initiates payment for a course
2. **Stripe Checkout**: Redirect user to Stripe Checkout page
3. **Payment Processing**: Stripe processes the payment
4. **Webhook Notification**: Stripe sends webhook to confirm payment
5. **Automatic Enrollment**: System creates enrollment after payment confirmation

### Webhook Events Handled

- `checkout.session.completed`: Payment successful, create enrollment
- `payment_intent.succeeded`: Payment confirmed
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Payment canceled

### Security Features

- Webhook signature verification
- Idempotency handling
- Error logging and monitoring
- Secure error responses

## 🎫 Coupon System

### Coupon Types

- **Percentage Discount**: Apply percentage discount (e.g., 10% off)
- **Fixed Amount Discount**: Apply fixed amount discount (e.g., $5 off)

### Validation Rules

- **Active Status**: Coupon must be active
- **Validity Period**: Check start and end dates
- **Usage Limits**: Respect maximum usage limits
- **Minimum Amount**: Enforce minimum purchase amounts
- **Course Restrictions**: Apply only to specified courses
- **Maximum Discount**: Cap maximum discount amount

### Example Coupon Usage

```typescript
// Validate coupon
const validation = await paymentService.validateCoupon({
  code: 'WELCOME10',
  courseId: 'course_123',
  amount: 9900, // $99.00 in cents
});

if (validation.isValid) {
  console.log(`Discount: $${validation.discountAmount}`);
  console.log(`Final Amount: $${validation.finalAmount}`);
}
```

## 📊 Enrollment System

### Enrollment Types

- **FREE**: No payment required
- **PAID**: Requires payment
- **SUBSCRIPTION**: Subscription-based access
- **INVITATION_ONLY**: Invitation required
- **WAITLIST**: Waitlist enrollment

### Enrollment Sources

- **DIRECT**: Direct enrollment
- **REFERRAL**: Referral enrollment
- **PROMOTION**: Promotional enrollment
- **BUNDLE**: Bundle enrollment
- **LEARNING_PATH**: Learning path enrollment

### Automatic Enrollment Flow

1. **Payment Success**: Webhook confirms payment
2. **Enrollment Creation**: System creates enrollment record
3. **Course Access**: User gains access to course content
4. **Analytics Update**: Update enrollment counts and metrics

## 🚀 Usage Examples

### Frontend Integration

#### Create Payment Session

```typescript
const createPaymentSession = async (courseId: string, couponCode?: string) => {
  const response = await fetch('/api/payments/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseId,
      couponCode,
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
    }),
  });

  const result = await response.json();

  if (result.success) {
    // Redirect to Stripe Checkout
    window.location.href = result.redirectUrl;
  }
};
```

#### Validate Coupon

```typescript
const validateCoupon = async (
  code: string,
  courseId: string,
  amount: number,
) => {
  const response = await fetch('/api/payments/coupons/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code,
      courseId,
      amount,
    }),
  });

  return await response.json();
};
```

#### Get User Enrollments

```typescript
const getUserEnrollments = async () => {
  const response = await fetch('/api/payments/enrollments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

### Backend Usage

#### Create Coupon

```typescript
// In your admin service
const coupon = await prisma.coupon.create({
  data: {
    code: 'WELCOME10',
    name: 'Welcome Discount',
    description: '10% off for new users',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxUses: 100,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    minimumAmount: 5000, // $50.00 minimum
    maximumDiscount: 2000, // $20.00 maximum discount
  },
});
```

#### Process Payment

```typescript
// In your payment service
const paymentSession = await paymentService.createPaymentSession(
  {
    courseId: 'course_123',
    couponCode: 'WELCOME10',
  },
  userId,
);

if (paymentSession.success) {
  // Redirect user to payment
  return { redirectUrl: paymentSession.redirectUrl };
}
```

## 🔧 Configuration

### Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/elearning"

# Clerk (existing)
CLERK_SECRET_KEY=sk_test_...
```

### Stripe Webhook Setup

1. **Install Stripe CLI**:

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**:

   ```bash
   stripe login
   ```

3. **Forward webhooks**:

   ```bash
   stripe listen --forward-to localhost:3001/api/payments/webhooks/stripe
   ```

4. **Get webhook secret**:
   ```bash
   stripe listen --print-secret
   ```

## 🧪 Testing

### Unit Tests

```typescript
describe('PaymentService', () => {
  it('should create payment session', async () => {
    const dto = {
      courseId: 'course_123',
      couponCode: 'WELCOME10',
    };

    const result = await service.createPaymentSession(dto, 'user_123');
    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Payment (e2e)', () => {
  it('/api/payments/sessions (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/payments/sessions')
      .send({
        courseId: 'course_123',
        couponCode: 'WELCOME10',
      })
      .expect(201);
  });
});
```

## 📈 Monitoring & Analytics

### Payment Analytics

- Track conversion rates
- Monitor payment failures
- Analyze coupon usage
- Revenue reporting

### Error Monitoring

- Webhook failures
- Payment session errors
- Coupon validation issues
- Database connection problems

### Logging

```typescript
// Payment service logs
this.logger.log(`Payment session created: ${sessionId}`);
this.logger.error('Error creating payment session:', error);
this.logger.log(`Payment completed for session: ${sessionId}`);
```

## 🔒 Security Considerations

### Payment Security

- Never store sensitive payment data
- Use Stripe's secure payment methods
- Implement webhook signature verification
- Use HTTPS for all communications

### Data Validation

- Validate all input data using DTOs
- Sanitize user inputs
- Implement rate limiting
- Use parameterized queries

### Error Handling

- Don't expose sensitive information in errors
- Log errors securely
- Implement proper error responses
- Handle webhook failures gracefully

## 🚀 Deployment

### Production Checklist

- [ ] Set production Stripe keys
- [ ] Configure webhook endpoints
- [ ] Set up SSL certificates
- [ ] Configure CORS policies
- [ ] Set up monitoring and logging
- [ ] Test webhook handling
- [ ] Verify payment flows
- [ ] Test coupon validation

### Environment Setup

```bash
# Production environment variables
DATABASE_URL="postgresql://user:password@host:5432/elearning"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="https://yourdomain.com"
NODE_ENV="production"
```

## 🤝 Support

For integration support:

1. Check the troubleshooting section
2. Review error logs
3. Test with Stripe test mode
4. Contact the development team

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Clerk Documentation](https://clerk.com/docs)

---

**Note**: This implementation provides a complete payment and enrollment system that integrates seamlessly with your existing e-learning platform. The system is designed to be scalable, secure, and maintainable.
