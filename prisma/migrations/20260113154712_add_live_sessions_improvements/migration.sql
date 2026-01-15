/*
  Warnings:

  - A unique constraint covering the columns `[groupInstanceId]` on the table `live_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AvailabilityOverrideType" AS ENUM ('BLOCK', 'MODIFY');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'OUTLOOK', 'APPLE', 'ICAL');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('IMPORT_ONLY', 'EXPORT_ONLY', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "InstanceStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN     "groupInstanceId" TEXT;

-- AlterTable
ALTER TABLE "instructor_availabilities" ALTER COLUMN "minAdvanceHours" SET DEFAULT 24;

-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "groupInstanceId" TEXT;

-- AlterTable
ALTER TABLE "session_offerings" ADD COLUMN     "autoCancelEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoCancelHoursBefore" INTEGER DEFAULT 2,
ADD COLUMN     "autoCancelRefund" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bufferMinutes" INTEGER DEFAULT 15,
ADD COLUMN     "minAdvanceHours" INTEGER DEFAULT 24;

-- CreateTable
CREATE TABLE "recurring_availability_rules" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxSessionsInSlot" INTEGER NOT NULL DEFAULT 1,
    "defaultSlotDuration" INTEGER NOT NULL DEFAULT 60,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 24,
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

    CONSTRAINT "recurring_availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_date_overrides" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "recurringRuleId" TEXT,
    "specificDate" TIMESTAMP(3) NOT NULL,
    "overrideType" "AvailabilityOverrideType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN,
    "maxSessionsInSlot" INTEGER,
    "bufferMinutes" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_date_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_syncs" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "autoBlockBusy" BOOLEAN NOT NULL DEFAULT true,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_offering_instances" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "currentEnrollments" INTEGER NOT NULL DEFAULT 0,
    "maxEnrollments" INTEGER NOT NULL,
    "minEnrollments" INTEGER NOT NULL,
    "status" "InstanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "autoCancelChecked" BOOLEAN NOT NULL DEFAULT false,
    "autoCancelAt" TIMESTAMP(3),
    "meetingRoomId" TEXT,
    "meetingLink" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_offering_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "availability_date_overrides_instructorId_specificDate_key" ON "availability_date_overrides"("instructorId", "specificDate");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_syncs_instructorId_provider_calendarId_key" ON "calendar_syncs"("instructorId", "provider", "calendarId");

-- CreateIndex
CREATE INDEX "group_offering_instances_scheduledStart_status_isBookable_idx" ON "group_offering_instances"("scheduledStart", "status", "isBookable");

-- CreateIndex
CREATE INDEX "group_offering_instances_instructorId_scheduledStart_idx" ON "group_offering_instances"("instructorId", "scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "group_offering_instances_offeringId_scheduledStart_key" ON "group_offering_instances"("offeringId", "scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "live_sessions_groupInstanceId_key" ON "live_sessions"("groupInstanceId");

-- AddForeignKey
ALTER TABLE "recurring_availability_rules" ADD CONSTRAINT "recurring_availability_rules_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_date_overrides" ADD CONSTRAINT "availability_date_overrides_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_date_overrides" ADD CONSTRAINT "availability_date_overrides_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "recurring_availability_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_offering_instances" ADD CONSTRAINT "group_offering_instances_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "session_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_offering_instances" ADD CONSTRAINT "group_offering_instances_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_groupInstanceId_fkey" FOREIGN KEY ("groupInstanceId") REFERENCES "group_offering_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_groupInstanceId_fkey" FOREIGN KEY ("groupInstanceId") REFERENCES "group_offering_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
