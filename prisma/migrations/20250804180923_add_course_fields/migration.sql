/*
  Warnings:

  - The values [PARENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[verificationCode]` on the table `certificates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `verificationCode` to the `certificates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LearningStyle" AS ENUM ('VISUAL', 'AUDITORY', 'READING_WRITING', 'KINESTHETIC', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "CourseIntensity" AS ENUM ('LIGHT', 'REGULAR', 'INTENSIVE', 'BOOTCAMP');

-- CreateEnum
CREATE TYPE "EnrollmentSource" AS ENUM ('DIRECT', 'REFERRAL', 'PROMOTION', 'BUNDLE', 'LEARNING_PATH');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO', 'WISTIA', 'SELF_HOSTED', 'AWS_S3', 'CLOUDINARY');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY', 'MATCHING', 'ORDERING', 'NUMERIC');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('TEXT', 'FILE_UPLOAD', 'URL_SUBMISSION', 'PEER_REVIEW');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED', 'RETURNED', 'LATE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'PENDING', 'FLAGGED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "AIInteractionType" ADD VALUE 'CONTENT_ANALYSIS';

-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'INTERVIEW_SCHEDULED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE 'PRESENTATION';
ALTER TYPE "ContentType" ADD VALUE 'SPREADSHEET';
ALTER TYPE "ContentType" ADD VALUE 'EBOOK';

-- AlterEnum
ALTER TYPE "CourseStatus" ADD VALUE 'COMING_SOON';

-- AlterEnum
ALTER TYPE "DiscussionType" ADD VALUE 'FEATURE_REQUEST';

-- AlterEnum
ALTER TYPE "EnrollmentStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "EnrollmentType" ADD VALUE 'WAITLIST';

-- AlterEnum
ALTER TYPE "InstructorStatus" ADD VALUE 'PROBATION';

-- AlterEnum
ALTER TYPE "LessonType" ADD VALUE 'SCORM';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ENROLLMENT_CONFIRMATION';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_CONFIRMATION';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL_REFUND';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('VISITOR', 'STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VISITOR';
COMMIT;

-- AlterTable
ALTER TABLE "ai_interactions" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "processingTime" INTEGER;

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "content_items" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "isDownloadable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0';

-- AlterTable
ALTER TABLE "course_drafts" ADD COLUMN     "lastAutoSave" TIMESTAMP(3),
ADD COLUMN     "saveCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "allowRetakes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "certificateTemplate" TEXT,
ADD COLUMN     "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "courseEndDate" TIMESTAMP(3),
ADD COLUMN     "courseStartDate" TIMESTAMP(3),
ADD COLUMN     "currentEnrollments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "discountValidUntil" TIMESTAMP(3),
ADD COLUMN     "downloadableResources" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enrollmentEndDate" TIMESTAMP(3),
ADD COLUMN     "enrollmentStartDate" TIMESTAMP(3),
ADD COLUMN     "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasAIQuizzes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasAssignments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasDiscussions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasInteractiveElements" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasLiveSessions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasProjectWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasQuizzes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "intensityLevel" "CourseIntensity" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMajorUpdate" TIMESTAMP(3),
ADD COLUMN     "maxAttempts" INTEGER,
ADD COLUMN     "maxStudents" INTEGER,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "mobileOptimized" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "offlineAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passingGrade" DOUBLE PRECISION NOT NULL DEFAULT 70,
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "subtitleLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetAudience" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "uniqueViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0',
ADD COLUMN     "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "discussions" ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "certificateEarned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateEarnedAt" TIMESTAMP(3),
ADD COLUMN     "completedLessons" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountApplied" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "enrollmentSource" "EnrollmentSource" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "totalLessons" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "instructor_applications" ADD COLUMN     "interviewNotes" TEXT,
ADD COLUMN     "interviewScheduled" TIMESTAMP(3),
ADD COLUMN     "interviewScore" INTEGER,
ADD COLUMN     "reviewScore" INTEGER,
ADD COLUMN     "sampleContent" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "autoTranscript" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "downloadable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "offlineContent" TEXT,
ADD COLUMN     "videoDuration" INTEGER,
ADD COLUMN     "videoProvider" "VideoProvider",
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "interactions" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "watchTime" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "flaggedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "valueForMoney" INTEGER;

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "estimatedDuration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "learningStyle" "LearningStyle",
ADD COLUMN     "locale" TEXT DEFAULT 'en',
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skillTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "teachingRating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "timeLimit" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "randomize" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "correctAnswer" JSONB NOT NULL DEFAULT '{}',
    "explanation" TEXT,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "dueDate" TIMESTAMP(3),
    "points" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "submissionType" "AssignmentType" NOT NULL DEFAULT 'TEXT',
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "maxFileSize" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "grade" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" INTEGER,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "lesson_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_bookmarks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "course_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" "CourseLevel" NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_learning_paths" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "pathId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "course_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_paths" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,

    CONSTRAINT "user_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "sendEmail" BOOLEAN NOT NULL DEFAULT false,
    "sendPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "course_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_bookmarks_userId_courseId_key" ON "course_bookmarks"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_learning_paths_pathId_courseId_key" ON "course_learning_paths"("pathId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_paths_userId_pathId_key" ON "user_learning_paths"("userId", "pathId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bookmarks" ADD CONSTRAINT "course_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bookmarks" ADD CONSTRAINT "course_bookmarks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_learning_paths" ADD CONSTRAINT "course_learning_paths_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_learning_paths" ADD CONSTRAINT "course_learning_paths_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_paths" ADD CONSTRAINT "user_learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_paths" ADD CONSTRAINT "user_learning_paths_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
