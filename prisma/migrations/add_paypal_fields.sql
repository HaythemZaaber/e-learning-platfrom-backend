-- Add PayPal payment support fields to PaymentSession table
-- Run this migration manually if migrate dev fails due to drift

ALTER TABLE "payment_sessions" 
ADD COLUMN IF NOT EXISTS "paypalOrderId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "paypalPaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "provider" TEXT DEFAULT 'STRIPE';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "payment_sessions_paypalOrderId_idx" ON "payment_sessions"("paypalOrderId");
CREATE INDEX IF NOT EXISTS "payment_sessions_provider_idx" ON "payment_sessions"("provider");
