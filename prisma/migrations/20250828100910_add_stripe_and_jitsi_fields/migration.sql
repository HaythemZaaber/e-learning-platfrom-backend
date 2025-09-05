/*
  Warnings:

  - You are about to drop the column `availableTimeSlots` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSchedule` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_link` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_room_id` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_account_id` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."idx_live_sessions_meeting_room_id";

-- DropIndex
DROP INDEX "public"."idx_users_stripe_account_id";

-- AlterTable
ALTER TABLE "public"."instructor_profiles" DROP COLUMN "availableTimeSlots",
DROP COLUMN "preferredSchedule";

-- AlterTable
ALTER TABLE "public"."live_sessions" DROP COLUMN "meeting_link",
DROP COLUMN "meeting_room_id";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "stripe_account_id",
ADD COLUMN     "stripeAccountId" TEXT;
