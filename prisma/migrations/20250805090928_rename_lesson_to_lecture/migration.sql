/*
  Warnings:

  - The values [NEW_LESSON] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lessonId` on the `content_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalLessons` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `discussions` table. All the data in the column will be lost.
  - You are about to drop the column `completedLessons` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `currentLessonId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `totalLessons` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `progress` table. All the data in the column will be lost.
  - You are about to drop the `lesson_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lessons` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[lectureId]` on the table `content_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,lectureId]` on the table `progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lectureId` to the `progress` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LectureType" AS ENUM ('VIDEO', 'TEXT', 'AUDIO', 'QUIZ', 'ASSIGNMENT', 'DOWNLOAD', 'INTERACTIVE', 'LIVE_SESSION', 'AR_VR', 'SCORM');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('COURSE_UPDATE', 'NEW_LECTURE', 'ASSIGNMENT_DUE', 'CERTIFICATE_EARNED', 'DISCUSSION_REPLY', 'INSTRUCTOR_APPROVED', 'SYSTEM_ANNOUNCEMENT', 'AI_RECOMMENDATION', 'ENROLLMENT_CONFIRMATION', 'PAYMENT_CONFIRMATION');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "content_items" DROP CONSTRAINT "content_items_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "discussions" DROP CONSTRAINT "discussions_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_notes" DROP CONSTRAINT "lesson_notes_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_notes" DROP CONSTRAINT "lesson_notes_userId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_lessonId_fkey";

-- DropIndex
DROP INDEX "content_items_lessonId_key";

-- DropIndex
DROP INDEX "progress_userId_lessonId_key";

-- AlterTable
ALTER TABLE "content_items" DROP COLUMN "lessonId",
ADD COLUMN     "lectureId" TEXT;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "totalLessons",
ADD COLUMN     "totalLectures" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "discussions" DROP COLUMN "lessonId",
ADD COLUMN     "lectureId" TEXT;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "completedLessons",
DROP COLUMN "currentLessonId",
DROP COLUMN "totalLessons",
ADD COLUMN     "completedLectures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentLectureId" TEXT,
ADD COLUMN     "totalLectures" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "progress" DROP COLUMN "lessonId",
ADD COLUMN     "lectureId" TEXT NOT NULL;

-- DropTable
DROP TABLE "lesson_notes";

-- DropTable
DROP TABLE "lessons";

-- DropEnum
DROP TYPE "LessonType";

-- CreateTable
CREATE TABLE "lectures" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LectureType" NOT NULL,
    "content" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "isInteractive" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "videoProvider" "VideoProvider",
    "videoDuration" INTEGER,
    "hasAIQuiz" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "transcription" TEXT,
    "autoTranscript" BOOLEAN NOT NULL DEFAULT false,
    "captions" TEXT,
    "transcript" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "offlineContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" INTEGER,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_items_lectureId_key" ON "content_items"("lectureId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_lectureId_key" ON "progress"("userId", "lectureId");

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_notes" ADD CONSTRAINT "lecture_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_notes" ADD CONSTRAINT "lecture_notes_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
