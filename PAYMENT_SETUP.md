# Payment System Setup Guide

## Quick Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Database (existing)
DATABASE_URL="postgresql://user:password@localhost:5432/elearning"

# Clerk (existing)
CLERK_SECRET_KEY=sk_test_...
```

### 2. Stripe Setup

1. **Get Stripe Keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to Developers > API keys
   - Copy your Secret key (starts with `sk_test_` for test mode)

2. **Set up Webhooks**:

   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe  # macOS

   # Login to Stripe
   stripe login

   # Forward webhooks to your local server
   stripe listen --forward-to localhost:3001/api/payments/webhooks/stripe

   # Copy the webhook secret (starts with whsec_)
   ```

### 3. Test the System

1. **Start your server**:

   ```bash
   npm run start:dev
   ```

2. **Test API endpoints**:

   ```bash
   # Get active coupons
   curl http://localhost:3001/api/payments/coupons/active

   # Create a test coupon in your database
   # Then test payment session creation (requires auth)
   ```

### 4. Frontend Integration

Use these endpoints in your frontend:

```typescript
// Create payment session
const response = await fetch('/api/payments/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    courseId: 'course_123',
    couponCode: 'WELCOME10', // optional
  }),
});

const result = await response.json();
if (result.success) {
  window.location.href = result.redirectUrl;
}
```

### 5. Database Migration

The system uses your existing Prisma schema. Make sure you have:

- `PaymentSession` model
- `Coupon` model
- `Enrollment` model (enhanced)

Run migrations if needed:

```bash
npx prisma migrate dev
```

### 6. Test Payment Flow

1. Create a course in your database
2. Create a test coupon
3. Use the frontend to initiate payment
4. Complete payment on Stripe
5. Verify enrollment is created automatically

## API Endpoints Summary

| Endpoint                                  | Method | Description                   |
| ----------------------------------------- | ------ | ----------------------------- |
| `/api/payments/sessions`                  | POST   | Create payment session        |
| `/api/payments/sessions/:id`              | GET    | Get payment session           |
| `/api/payments/sessions/stripe/:stripeId` | GET    | Get payment session by Stripe |
| `/api/payments/sessions/:id/cancel`       | POST   | Cancel payment session        |
| `/api/payments/coupons/validate`          | POST   | Validate coupon               |
| `/api/payments/coupons/active`            | GET    | Get active coupons            |
| `/api/payments/enrollments`               | POST   | Create enrollment             |
| `/api/payments/enrollments`               | GET    | Get user enrollments          |
| `/api/payments/webhooks/stripe`           | POST   | Stripe webhook handler        |

## Security Notes

- All payment endpoints require authentication
- Webhook endpoint is public but verified with Stripe signature
- Never expose Stripe secret keys in frontend code
- Use HTTPS in production

## Troubleshooting

1. **Webhook not working**: Check webhook secret and endpoint URL
2. **Payment session creation fails**: Verify Stripe secret key
3. **Authentication errors**: Check Clerk configuration
4. **Database errors**: Run Prisma migrations

## Next Steps

1. Set up production Stripe keys
2. Configure production webhook endpoints
3. Add monitoring and logging
4. Test with real payments
5. Implement additional payment methods if needed
