/*
  Warnings:

  - The values [SUPER_ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `interviewNotes` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `interviewScheduled` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `interviewScore` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `motivation` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `qualificationDocs` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `reviewNotes` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `reviewScore` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `instructor_applications` table. All the data in the column will be lost.
  - You are about to drop the column `teachingExperience` on the `instructor_applications` table. All the data in the column will be lost.
  - The `identityDocument` column on the `instructor_applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sampleContent` column on the `instructor_applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `achievements` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `averageCompletionRate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `currentStreak` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `expertise` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `instructorBio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivityAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `learningStyle` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `longestStreak` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguages` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `qualifications` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `skillTags` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `socialLinks` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `teachingRating` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalCourses` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalCoursesCompleted` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalCoursesEnrolled` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalPoints` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalTimeSpent` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `zip` on the `users` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `instructor_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `instructor_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teachingMotivation` to the `instructor_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearsOfExperience` to the `instructor_applications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('IDENTITY_DOCUMENT', 'EDUCATION_CERTIFICATE', 'PROFESSIONAL_CERTIFICATE', 'EMPLOYMENT_VERIFICATION', 'PROFILE_PHOTO', 'VIDEO_INTRODUCTION', 'TEACHING_DEMO', 'RESUME', 'PORTFOLIO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StudentLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "public"."AdminLevel" AS ENUM ('MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "public"."DraftType" AS ENUM ('COURSE', 'APPLICATION', 'PROFILE', 'CONTENT');

-- CreateEnum
CREATE TYPE "public"."AIRecommendation" AS ENUM ('APPROVE', 'REJECT', 'MANUAL_REVIEW_REQUIRED', 'INTERVIEW_REQUIRED', 'MORE_DOCUMENTS_NEEDED');

-- CreateEnum
CREATE TYPE "public"."ReviewDecision" AS ENUM ('APPROVE', 'REJECT', 'CONDITIONAL_APPROVE', 'REQUEST_INTERVIEW', 'REQUEST_MORE_INFO');

-- CreateEnum
CREATE TYPE "public"."InterviewFormat" AS ENUM ('VIDEO_CALL', 'PHONE_CALL', 'IN_PERSON', 'ASYNCHRONOUS_VIDEO');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('VISITOR', 'STUDENT', 'INSTRUCTOR', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'VISITOR';
COMMIT;

-- DropIndex
DROP INDEX "public"."payment_sessions_stripeSessionId_idx";

-- AlterTable
ALTER TABLE "public"."course_drafts" ADD COLUMN     "description" TEXT,
ADD COLUMN     "draftType" "public"."DraftType" NOT NULL DEFAULT 'COURSE',
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "public"."instructor_applications" DROP COLUMN "interviewNotes",
DROP COLUMN "interviewScheduled",
DROP COLUMN "interviewScore",
DROP COLUMN "motivation",
DROP COLUMN "qualificationDocs",
DROP COLUMN "reviewNotes",
DROP COLUMN "reviewScore",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "teachingExperience",
ADD COLUMN     "applicationData" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "completionScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consents" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "currentJobTitle" TEXT,
ADD COLUMN     "currentStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "documents" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "educationCerts" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "lastAutoSave" TIMESTAMP(3),
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "personalInfo" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "professionalBackground" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "professionalCerts" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "subjectsToTeach" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "teachingInformation" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "teachingMotivation" TEXT NOT NULL,
ADD COLUMN     "yearsOfExperience" INTEGER NOT NULL,
DROP COLUMN "identityDocument",
ADD COLUMN     "identityDocument" JSONB DEFAULT '{}',
DROP COLUMN "sampleContent",
ADD COLUMN     "sampleContent" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "achievements",
DROP COLUMN "address",
DROP COLUMN "averageCompletionRate",
DROP COLUMN "bio",
DROP COLUMN "currentStreak",
DROP COLUMN "experience",
DROP COLUMN "expertise",
DROP COLUMN "instructorBio",
DROP COLUMN "lastActivityAt",
DROP COLUMN "learningStyle",
DROP COLUMN "longestStreak",
DROP COLUMN "preferredLanguages",
DROP COLUMN "qualifications",
DROP COLUMN "rating",
DROP COLUMN "skillTags",
DROP COLUMN "socialLinks",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "teachingRating",
DROP COLUMN "title",
DROP COLUMN "totalCourses",
DROP COLUMN "totalCoursesCompleted",
DROP COLUMN "totalCoursesEnrolled",
DROP COLUMN "totalPoints",
DROP COLUMN "totalStudents",
DROP COLUMN "totalTimeSpent",
DROP COLUMN "zip";

-- CreateTable
CREATE TABLE "public"."instructor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "shortBio" TEXT,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" INTEGER DEFAULT 0,
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "personalWebsite" TEXT,
    "linkedinProfile" TEXT,
    "subjectsTeaching" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teachingCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languagesSpoken" JSONB NOT NULL DEFAULT '[]',
    "teachingStyle" TEXT,
    "targetAudience" TEXT,
    "teachingMethodology" TEXT,
    "teachingRating" DOUBLE PRECISION DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "averageCourseRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentRetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courseCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "studentSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAcceptingStudents" BOOLEAN NOT NULL DEFAULT true,
    "maxStudentsPerCourse" INTEGER,
    "preferredSchedule" JSONB NOT NULL DEFAULT '{}',
    "availableTimeSlots" JSONB NOT NULL DEFAULT '[]',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationLevel" TEXT,
    "lastVerificationDate" TIMESTAMP(3),
    "complianceStatus" TEXT DEFAULT 'COMPLIANT',
    "totalLectures" INTEGER NOT NULL DEFAULT 0,
    "totalVideoHours" INTEGER NOT NULL DEFAULT 0,
    "totalQuizzes" INTEGER NOT NULL DEFAULT 0,
    "totalAssignments" INTEGER NOT NULL DEFAULT 0,
    "contentUpdateFreq" INTEGER NOT NULL DEFAULT 0,
    "payoutSettings" JSONB NOT NULL DEFAULT '{}',
    "taxInformation" JSONB NOT NULL DEFAULT '{}',
    "paymentPreferences" JSONB NOT NULL DEFAULT '{}',
    "revenueSharing" DOUBLE PRECISION DEFAULT 70,
    "isPromotionEligible" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "featuredInstructor" BOOLEAN NOT NULL DEFAULT false,
    "badgesEarned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastCourseUpdate" TIMESTAMP(3),
    "lastStudentReply" TIMESTAMP(3),
    "lastContentCreation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningStyle" "public"."LearningStyle",
    "preferredLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillLevel" "public"."StudentLevel" NOT NULL DEFAULT 'BEGINNER',
    "learningGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT,
    "fieldOfStudy" TEXT,
    "currentStatus" TEXT,
    "industry" TEXT,
    "jobTitle" TEXT,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "totalCoursesEnrolled" INTEGER NOT NULL DEFAULT 0,
    "totalCoursesCompleted" INTEGER NOT NULL DEFAULT 0,
    "averageCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "studyStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "leaderboardRank" INTEGER,
    "preferredStudyTime" JSONB NOT NULL DEFAULT '{}',
    "sessionDuration" INTEGER NOT NULL DEFAULT 30,
    "reminderSettings" JSONB NOT NULL DEFAULT '{}',
    "notificationSettings" JSONB NOT NULL DEFAULT '{}',
    "studyGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "studyBuddies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "shareProgress" BOOLEAN NOT NULL DEFAULT false,
    "careerGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillsToLearn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industryInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resumeUrl" TEXT,
    "portfolioUrl" TEXT,
    "jobSearchStatus" TEXT,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "budgetPreference" TEXT,
    "subscriptionPlan" TEXT,
    "accessibilityNeeds" JSONB NOT NULL DEFAULT '{}',
    "learningDisabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminLevel" "public"."AdminLevel" NOT NULL DEFAULT 'MODERATOR',
    "department" TEXT,
    "title" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessLevel" INTEGER NOT NULL DEFAULT 1,
    "workEmail" TEXT,
    "workPhone" TEXT,
    "emergencyContact" JSONB NOT NULL DEFAULT '{}',
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalApprovals" INTEGER NOT NULL DEFAULT 0,
    "totalRejections" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "casesHandled" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languagesSupported" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workingHours" JSONB NOT NULL DEFAULT '{}',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "lastSecurityCheck" TIMESTAMP(3),
    "complianceTraining" JSONB NOT NULL DEFAULT '[]',
    "backgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "securityClearance" TEXT,
    "userSatisfactionRating" DOUBLE PRECISION DEFAULT 0,
    "escalationRate" DOUBLE PRECISION DEFAULT 0,
    "resolutionRate" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instructor_ai_verifications" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "identityConfidence" DOUBLE PRECISION,
    "identityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "educationVerified" BOOLEAN NOT NULL DEFAULT false,
    "educationConfidence" DOUBLE PRECISION,
    "educationFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceVerified" BOOLEAN NOT NULL DEFAULT false,
    "experienceConfidence" DOUBLE PRECISION,
    "experienceFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentQualityScore" DOUBLE PRECISION,
    "languageProficiency" DOUBLE PRECISION,
    "professionalismScore" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "riskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fraudIndicators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "overallScore" DOUBLE PRECISION,
    "recommendation" "public"."AIRecommendation" NOT NULL,
    "recommendationReason" TEXT,
    "verificationProvider" TEXT,
    "processingTime" INTEGER,
    "processingCost" DOUBLE PRECISION,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_ai_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instructor_manual_reviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "documentationScore" INTEGER,
    "experienceScore" INTEGER,
    "communicationScore" INTEGER,
    "technicalScore" INTEGER,
    "professionalismScore" INTEGER,
    "overallScore" DOUBLE PRECISION,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "concerns" TEXT,
    "recommendations" TEXT,
    "decision" "public"."ReviewDecision" NOT NULL,
    "decisionReason" TEXT,
    "conditionalRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiresInterview" BOOLEAN NOT NULL DEFAULT false,
    "requiresAdditionalDocs" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_manual_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instructor_interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "format" "public"."InterviewFormat" NOT NULL DEFAULT 'VIDEO_CALL',
    "meetingLink" TEXT,
    "interviewNotes" TEXT,
    "communicationScore" INTEGER,
    "technicalKnowledge" INTEGER,
    "teachingDemonstration" INTEGER,
    "culturalFit" INTEGER,
    "overallScore" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "feedback" TEXT,
    "nextSteps" TEXT,
    "recordingUrl" TEXT,
    "recordingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_verification_logs" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "verificationProvider" TEXT NOT NULL,
    "verificationResult" JSONB NOT NULL DEFAULT '{}',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiAnalysis" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_userId_key" ON "public"."instructor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "public"."student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "public"."admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_ai_verifications_applicationId_key" ON "public"."instructor_ai_verifications"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_manual_reviews_applicationId_key" ON "public"."instructor_manual_reviews"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_interviews_applicationId_key" ON "public"."instructor_interviews"("applicationId");

-- AddForeignKey
ALTER TABLE "public"."instructor_profiles" ADD CONSTRAINT "instructor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_ai_verifications" ADD CONSTRAINT "instructor_ai_verifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."instructor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_manual_reviews" ADD CONSTRAINT "instructor_manual_reviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."instructor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_manual_reviews" ADD CONSTRAINT "instructor_manual_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_interviews" ADD CONSTRAINT "instructor_interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."instructor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_interviews" ADD CONSTRAINT "instructor_interviews_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_verification_logs" ADD CONSTRAINT "document_verification_logs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."instructor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_verification_logs" ADD CONSTRAINT "document_verification_logs_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."instructor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
