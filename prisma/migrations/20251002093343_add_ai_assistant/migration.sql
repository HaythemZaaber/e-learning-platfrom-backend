/*
  Warnings:

  - You are about to drop the column `confidence` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `context` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `isHelpful` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `processingTime` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `query` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_link` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_room_id` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_account_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `request` to the `ai_interactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `ai_interactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `response` on the `ai_interactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."ai_interactions" DROP CONSTRAINT "ai_interactions_courseId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "public"."idx_live_sessions_meeting_room_id";

-- DropIndex
DROP INDEX IF EXISTS "public"."idx_users_stripe_account_id";

-- AlterTable
ALTER TABLE "public"."ai_interactions" DROP COLUMN "confidence",
DROP COLUMN "context",
DROP COLUMN "isHelpful",
DROP COLUMN "processingTime",
DROP COLUMN "query",
ADD COLUMN     "request" JSONB NOT NULL,
ADD COLUMN     "tokens" INTEGER,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "response",
ADD COLUMN     "response" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."live_sessions" DROP COLUMN IF EXISTS "meeting_link",
DROP COLUMN IF EXISTS "meeting_room_id";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "stripe_account_id",
ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;

-- CreateTable
CREATE TABLE "public"."ai_cache_entries" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_entries_cacheKey_key" ON "public"."ai_cache_entries"("cacheKey");

-- CreateIndex
CREATE INDEX "ai_cache_entries_expiresAt_idx" ON "public"."ai_cache_entries"("expiresAt");

-- CreateIndex
CREATE INDEX "ai_interactions_userId_idx" ON "public"."ai_interactions"("userId");

-- CreateIndex
CREATE INDEX "ai_interactions_courseId_idx" ON "public"."ai_interactions"("courseId");

-- AddForeignKey
ALTER TABLE "public"."ai_interactions" ADD CONSTRAINT "ai_interactions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
