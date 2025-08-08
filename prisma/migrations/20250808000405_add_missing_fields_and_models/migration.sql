/*
  Warnings:

  - You are about to drop the column `attempts` on the `progress` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,courseId,lectureId]` on the table `progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."progress_userId_lectureId_key";

-- AlterTable
ALTER TABLE "public"."content_items" ALTER COLUMN "version" DROP NOT NULL,
ALTER COLUMN "version" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."enrollments" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "source" "public"."EnrollmentSource" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "type" "public"."EnrollmentType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "public"."progress" DROP COLUMN "attempts",
DROP COLUMN "score",
ADD COLUMN     "certificateEarned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateIssuedAt" TIMESTAMP(3),
ADD COLUMN     "currentLessonId" TEXT,
ADD COLUMN     "currentTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastWatchedAt" TIMESTAMP(3),
ADD COLUMN     "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "streakDays" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "lectureId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_courseId_lectureId_key" ON "public"."progress"("userId", "courseId", "lectureId");
