-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "InstructorStatus" AS ENUM ('NOT_APPLIED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_MORE_INFO');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'ALL_LEVELS');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('FREE', 'PAID', 'SUBSCRIPTION', 'INVITATION_ONLY');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'AUDIO', 'QUIZ', 'ASSIGNMENT', 'DOWNLOAD', 'INTERACTIVE', 'LIVE_SESSION', 'AR_VR');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('FREE', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AIInteractionType" AS ENUM ('QUESTION', 'EXPLANATION', 'QUIZ_GENERATION', 'SUMMARY', 'RECOMMENDATION', 'TUTORING', 'CODE_REVIEW');

-- CreateEnum
CREATE TYPE "DiscussionType" AS ENUM ('QUESTION', 'ANSWER', 'ANNOUNCEMENT', 'GENERAL', 'BUG_REPORT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COURSE_UPDATE', 'NEW_LESSON', 'ASSIGNMENT_DUE', 'CERTIFICATE_EARNED', 'DISCUSSION_REPLY', 'INSTRUCTOR_APPROVED', 'SYSTEM_ANNOUNCEMENT', 'AI_RECOMMENDATION');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "experience" INTEGER,
ADD COLUMN     "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "instructorBio" TEXT,
ADD COLUMN     "instructorStatus" "InstructorStatus" NOT NULL DEFAULT 'NOT_APPLIED',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "socialLinks" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "username" TEXT,
ALTER COLUMN "role" SET DEFAULT 'VISITOR';

-- CreateTable
CREATE TABLE "instructor_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "teachingExperience" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "resumeUrl" TEXT,
    "identityDocument" TEXT,
    "qualificationDocs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "thumbnail" TEXT,
    "trailer" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whatYouLearn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoDescription" TEXT,
    "marketingTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'FREE',
    "language" TEXT NOT NULL DEFAULT 'en',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "certificate" BOOLEAN NOT NULL DEFAULT false,
    "hasAITutor" BOOLEAN NOT NULL DEFAULT false,
    "aiPersonality" TEXT,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "estimatedHours" INTEGER NOT NULL DEFAULT 0,
    "accessibility" JSONB NOT NULL DEFAULT '{"captions": false, "transcripts": false, "audioDescription": false, "signLanguage": false}',
    "views" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LessonType" NOT NULL,
    "content" TEXT,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "attachmentUrl" TEXT,
    "downloadUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "isInteractive" BOOLEAN NOT NULL DEFAULT false,
    "hasAIQuiz" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "transcription" TEXT,
    "captions" TEXT,
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentLessonId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'FREE',
    "paymentId" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "difficultyRating" DOUBLE PRECISION,
    "aiRecommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "courseQuality" INTEGER,
    "instructorRating" INTEGER,
    "difficultyRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL,
    "type" "AIInteractionType" NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "isHelpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "templateUrl" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "completionScore" DOUBLE PRECISION,
    "completionTime" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussions" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "DiscussionType" NOT NULL DEFAULT 'QUESTION',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "parentId" TEXT,

    CONSTRAINT "discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_applications_userId_key" ON "instructor_applications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_courseId_key" ON "enrollments"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_userId_lessonId_key" ON "progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_courseId_key" ON "reviews"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateId_key" ON "certificates"("certificateId");

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "discussions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
