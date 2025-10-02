/*
  Warnings:

  - You are about to drop the column `availableTimeSlots` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSchedule` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_link` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_room_id` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_account_id` on the `users` table. All the data in the column will be lost.
*/

-- Drop indexes defensively in the right schema
DROP INDEX IF EXISTS "public"."idx_live_sessions_meeting_room_id";
DROP INDEX IF EXISTS "public"."idx_users_stripe_account_id";

-- AlterTable: instructor_profiles
ALTER TABLE IF EXISTS "public"."instructor_profiles"
  DROP COLUMN IF EXISTS "availableTimeSlots",
  DROP COLUMN IF EXISTS "preferredSchedule";


