-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE INDEX "payment_sessions_stripeSessionId_idx" ON "public"."payment_sessions"("stripeSessionId");
