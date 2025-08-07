/*
  Warnings:

  - You are about to drop the column `aiPersonality` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `hasAIQuizzes` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `hasAITutor` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `hasInteractiveElements` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `hasLiveSessions` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `hasProjectWork` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."courses" DROP COLUMN "aiPersonality",
DROP COLUMN "hasAIQuizzes",
DROP COLUMN "hasAITutor",
DROP COLUMN "hasInteractiveElements",
DROP COLUMN "hasLiveSessions",
DROP COLUMN "hasProjectWork";
