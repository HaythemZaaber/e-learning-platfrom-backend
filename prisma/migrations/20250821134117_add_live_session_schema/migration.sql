/*
  Warnings:

  - You are about to drop the column `averageResponseTime` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundCheck` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `casesHandled` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `complianceTraining` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `escalationRate` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `languagesSupported` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastSecurityCheck` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionRate` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `securityClearance` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `specializations` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalApprovals` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalRejections` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalReviews` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `userSatisfactionRating` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `workEmail` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `workPhone` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `admin_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `badgesEarned` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `contentUpdateFreq` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `featuredInstructor` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `isPromotionEligible` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastContentCreation` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastCourseUpdate` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastStudentReply` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `marketingConsent` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `paymentPreferences` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `payoutSettings` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `revenueSharing` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `taxInformation` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalAssignments` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalLectures` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuizzes` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalVideoHours` on the `instructor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `accessibilityNeeds` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `budgetPreference` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `careerGoals` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `industryInterests` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `jobSearchStatus` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `learningDisabilities` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `mentors` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `notificationSettings` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `portfolioUrl` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredStudyTime` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `publicProfile` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSettings` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `resumeUrl` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `sessionDuration` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `shareProgress` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `skillsToLearn` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `studyBuddies` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `studyGroups` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionPlan` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `supportRequests` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpent` on the `student_profiles` table. All the data in the column will be lost.
  - Made the column `teachingRating` on table `instructor_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."LiveSessionType" AS ENUM ('COURSE_BASED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."SessionType" AS ENUM ('INDIVIDUAL', 'SMALL_GROUP', 'LARGE_GROUP', 'WORKSHOP', 'MASTERCLASS');

-- CreateEnum
CREATE TYPE "public"."SessionFormat" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."SessionMode" AS ENUM ('LIVE', 'RECORDED', 'BLENDED');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."BookingMode" AS ENUM ('REQUEST', 'DIRECT');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."CancellationPolicy" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT');

-- CreateEnum
CREATE TYPE "public"."SessionTopicType" AS ENUM ('FIXED', 'FLEXIBLE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."TopicDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "public"."ParticipantRole" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ASSISTANT', 'OBSERVER');

-- CreateEnum
CREATE TYPE "public"."ParticipantStatus" AS ENUM ('ENROLLED', 'ATTENDED', 'NO_SHOW', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('NOT_ATTENDED', 'PRESENT', 'ABSENT', 'LATE', 'LEFT_EARLY', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET');

-- CreateEnum
CREATE TYPE "public"."ReviewType" AS ENUM ('SESSION', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "public"."PaymentTiming" AS ENUM ('BEFORE_SESSION', 'AFTER_SESSION', 'ON_COMPLETION');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'RETRYING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'BOOKING_RECEIVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'BOOKING_ACCEPTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'BOOKING_REJECTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SESSION_REMINDER';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SESSION_STARTING';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SESSION_COMPLETED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PAYOUT_PROCESSED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TOPIC_APPROVAL_NEEDED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'SCHEDULE_CONFLICT';

-- AlterTable
ALTER TABLE "public"."admin_profiles" DROP COLUMN "averageResponseTime",
DROP COLUMN "backgroundCheck",
DROP COLUMN "casesHandled",
DROP COLUMN "complianceTraining",
DROP COLUMN "emergencyContact",
DROP COLUMN "escalationRate",
DROP COLUMN "languagesSupported",
DROP COLUMN "lastSecurityCheck",
DROP COLUMN "resolutionRate",
DROP COLUMN "securityClearance",
DROP COLUMN "specializations",
DROP COLUMN "timezone",
DROP COLUMN "totalApprovals",
DROP COLUMN "totalRejections",
DROP COLUMN "totalReviews",
DROP COLUMN "userSatisfactionRating",
DROP COLUMN "workEmail",
DROP COLUMN "workPhone",
DROP COLUMN "workingHours";

-- AlterTable
ALTER TABLE "public"."instructor_profiles" DROP COLUMN "badgesEarned",
DROP COLUMN "contentUpdateFreq",
DROP COLUMN "featuredInstructor",
DROP COLUMN "isPromotionEligible",
DROP COLUMN "lastContentCreation",
DROP COLUMN "lastCourseUpdate",
DROP COLUMN "lastStudentReply",
DROP COLUMN "marketingConsent",
DROP COLUMN "paymentPreferences",
DROP COLUMN "payoutSettings",
DROP COLUMN "revenueSharing",
DROP COLUMN "taxInformation",
DROP COLUMN "totalAssignments",
DROP COLUMN "totalLectures",
DROP COLUMN "totalQuizzes",
DROP COLUMN "totalVideoHours",
ADD COLUMN     "autoAcceptBookings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "averageSessionRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "bufferBetweenSessions" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "defaultCancellationPolicy" "public"."CancellationPolicy" NOT NULL DEFAULT 'MODERATE',
ADD COLUMN     "defaultSessionDuration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "defaultSessionFormat" "public"."SessionFormat" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "defaultSessionType" "public"."SessionType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "groupSessionRate" DOUBLE PRECISION DEFAULT 30,
ADD COLUMN     "individualSessionRate" DOUBLE PRECISION DEFAULT 50,
ADD COLUMN     "instantMeetingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liveSessionsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxSessionsPerDay" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "minAdvanceBooking" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "platformFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN     "preferredGroupSize" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "sessionCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalLiveSessions" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "teachingRating" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."learning_paths" ALTER COLUMN "estimatedDuration" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."student_profiles" DROP COLUMN "accessibilityNeeds",
DROP COLUMN "budgetPreference",
DROP COLUMN "careerGoals",
DROP COLUMN "currency",
DROP COLUMN "industryInterests",
DROP COLUMN "jobSearchStatus",
DROP COLUMN "learningDisabilities",
DROP COLUMN "mentors",
DROP COLUMN "notificationSettings",
DROP COLUMN "portfolioUrl",
DROP COLUMN "preferredStudyTime",
DROP COLUMN "publicProfile",
DROP COLUMN "reminderSettings",
DROP COLUMN "resumeUrl",
DROP COLUMN "sessionDuration",
DROP COLUMN "shareProgress",
DROP COLUMN "skillsToLearn",
DROP COLUMN "studyBuddies",
DROP COLUMN "studyGroups",
DROP COLUMN "subscriptionPlan",
DROP COLUMN "supportRequests",
DROP COLUMN "totalSpent";

-- CreateTable
CREATE TABLE "public"."instructor_availabilities" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "specificDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxSessionsInSlot" INTEGER NOT NULL DEFAULT 1,
    "defaultSlotDuration" INTEGER NOT NULL DEFAULT 60,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 12,
    "maxAdvanceHours" INTEGER DEFAULT 720,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "autoAcceptBookings" BOOLEAN NOT NULL DEFAULT false,
    "priceOverride" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notes" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_slots" (
    "id" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "slotDuration" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "maxBookings" INTEGER NOT NULL DEFAULT 1,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_topics" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "difficulty" "public"."TopicDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "suggestedDuration" INTEGER,
    "suggestedFormat" "public"."SessionType",
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_offerings" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "topicType" "public"."SessionTopicType" NOT NULL DEFAULT 'FIXED',
    "topicId" TEXT,
    "fixedTopic" TEXT,
    "domain" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionType" "public"."SessionType" NOT NULL DEFAULT 'INDIVIDUAL',
    "sessionFormat" "public"."SessionFormat" NOT NULL DEFAULT 'ONLINE',
    "duration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "minParticipants" INTEGER,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "cancellationPolicy" "public"."CancellationPolicy" NOT NULL DEFAULT 'MODERATE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whiteboardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "screenShareEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_requests" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bookingMode" "public"."BookingMode" NOT NULL DEFAULT 'REQUEST',
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "alternativeDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "timeSlotId" TEXT,
    "customTopic" TEXT,
    "topicDescription" TEXT,
    "customRequirements" TEXT,
    "studentMessage" TEXT,
    "instructorResponse" TEXT,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
    "offeredPrice" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "stripeSessionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."live_sessions" (
    "id" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "offeringId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "sessionType" "public"."LiveSessionType" NOT NULL DEFAULT 'CUSTOM',
    "courseId" TEXT,
    "lectureId" TEXT,
    "topicId" TEXT,
    "customTopic" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "finalTopic" TEXT,
    "format" "public"."SessionType" NOT NULL DEFAULT 'INDIVIDUAL',
    "sessionFormat" "public"."SessionFormat" NOT NULL DEFAULT 'ONLINE',
    "sessionMode" "public"."SessionMode" NOT NULL DEFAULT 'LIVE',
    "maxParticipants" INTEGER NOT NULL DEFAULT 1,
    "minParticipants" INTEGER NOT NULL DEFAULT 1,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "actualDuration" INTEGER,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "meetingRoomId" TEXT,
    "meetingLink" TEXT,
    "meetingPassword" TEXT,
    "recordingUrl" TEXT,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionNotes" TEXT,
    "instructorNotes" TEXT,
    "summary" TEXT,
    "sessionArtifacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pricePerPerson" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instructorPayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payoutStatus" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timeSlotId" TEXT,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_reservations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDue" TIMESTAMP(3),
    "attendance" "public"."AttendanceStatus" NOT NULL DEFAULT 'NOT_ATTENDED',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "requestedTopic" TEXT,
    "learnerNotes" TEXT,
    "instructorNotes" TEXT,
    "agreedPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_payments" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "sessionId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTiming" "public"."PaymentTiming" NOT NULL DEFAULT 'BEFORE_SESSION',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "stripePaymentId" TEXT,
    "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."ParticipantRole" NOT NULL DEFAULT 'STUDENT',
    "status" "public"."ParticipantStatus" NOT NULL DEFAULT 'ENROLLED',
    "deviceType" "public"."DeviceType" NOT NULL DEFAULT 'DESKTOP',
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentDate" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "cameraOnTime" INTEGER NOT NULL DEFAULT 0,
    "micActiveTime" INTEGER NOT NULL DEFAULT 0,
    "chatMessages" INTEGER NOT NULL DEFAULT 0,
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "pollResponses" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_reviews" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewType" "public"."ReviewType" NOT NULL DEFAULT 'SESSION',
    "overallRating" INTEGER NOT NULL,
    "contentQuality" INTEGER,
    "instructorRating" INTEGER,
    "technicalQuality" INTEGER,
    "valueForMoney" INTEGER,
    "positives" TEXT,
    "improvements" TEXT,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payout_sessions" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instructor_payouts" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutMethod" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "stripePayoutId" TEXT,
    "bankTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isEmail" BOOLEAN NOT NULL DEFAULT false,
    "isPush" BOOLEAN NOT NULL DEFAULT false,
    "isSMS" BOOLEAN NOT NULL DEFAULT false,
    "deliveryStatus" "public"."DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "sessionId" TEXT,
    "bookingRequestId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_availabilities_instructorId_specificDate_startTi_key" ON "public"."instructor_availabilities"("instructorId", "specificDate", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "time_slots_date_isAvailable_isBooked_idx" ON "public"."time_slots"("date", "isAvailable", "isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_availabilityId_startTime_key" ON "public"."time_slots"("availabilityId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "live_sessions_bookingRequestId_key" ON "public"."live_sessions"("bookingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "session_reservations_sessionId_learnerId_key" ON "public"."session_reservations"("sessionId", "learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_sessionId_userId_key" ON "public"."session_participants"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_userId_key" ON "public"."attendance_records"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_reviews_sessionId_reviewerId_key" ON "public"."session_reviews"("sessionId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_sessions_payoutId_sessionId_key" ON "public"."payout_sessions"("payoutId", "sessionId");

-- AddForeignKey
ALTER TABLE "public"."instructor_availabilities" ADD CONSTRAINT "instructor_availabilities_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_slots" ADD CONSTRAINT "time_slots_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "public"."instructor_availabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_topics" ADD CONSTRAINT "session_topics_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_offerings" ADD CONSTRAINT "session_offerings_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_offerings" ADD CONSTRAINT "session_offerings_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."session_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_requests" ADD CONSTRAINT "booking_requests_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "public"."session_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_requests" ADD CONSTRAINT "booking_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_requests" ADD CONSTRAINT "booking_requests_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "public"."time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."live_sessions" ADD CONSTRAINT "live_sessions_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "public"."booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."live_sessions" ADD CONSTRAINT "live_sessions_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "public"."session_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."live_sessions" ADD CONSTRAINT "live_sessions_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."live_sessions" ADD CONSTRAINT "live_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."live_sessions" ADD CONSTRAINT "live_sessions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."session_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."live_sessions" ADD CONSTRAINT "live_sessions_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "public"."time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_reservations" ADD CONSTRAINT "session_reservations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_reservations" ADD CONSTRAINT "session_reservations_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_payments" ADD CONSTRAINT "session_payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."session_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_payments" ADD CONSTRAINT "session_payments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_payments" ADD CONSTRAINT "session_payments_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_reviews" ADD CONSTRAINT "session_reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_reviews" ADD CONSTRAINT "session_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payout_sessions" ADD CONSTRAINT "payout_sessions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "public"."instructor_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payout_sessions" ADD CONSTRAINT "payout_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_payouts" ADD CONSTRAINT "instructor_payouts_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_notifications" ADD CONSTRAINT "session_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_notifications" ADD CONSTRAINT "session_notifications_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."live_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_notifications" ADD CONSTRAINT "session_notifications_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "public"."booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
