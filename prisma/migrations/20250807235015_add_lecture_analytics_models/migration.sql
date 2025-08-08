-- AlterTable
ALTER TABLE "public"."lectures" ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "averageCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "totalCoursesCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCoursesEnrolled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTimeSpent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."lecture_resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT true,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecture_ratings" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1,
    "feedback" TEXT,
    "isHelpful" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecture_issues" (
    "id" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecture_access_requests" (
    "id" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecture_transcripts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timestamps" JSONB NOT NULL DEFAULT '{}',
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecture_summaries" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "estimatedReadingTime" INTEGER NOT NULL DEFAULT 0,
    "isAI" BOOLEAN NOT NULL DEFAULT true,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lectureId" TEXT NOT NULL,

    CONSTRAINT "lecture_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecture_analytics" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "averageWatchTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dropOffPoints" JSONB NOT NULL DEFAULT '[]',
    "popularSegments" JSONB NOT NULL DEFAULT '[]',
    "userInteractions" JSONB NOT NULL DEFAULT '[]',
    "heatmapData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_analytics" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "totalEnrollments" INTEGER NOT NULL DEFAULT 0,
    "activeEnrollments" INTEGER NOT NULL DEFAULT 0,
    "completedEnrollments" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "averageRevenuePerEnrollment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDiscussions" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "averageTimeSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyEnrollments" JSONB NOT NULL DEFAULT '{}',
    "monthlyRevenue" JSONB NOT NULL DEFAULT '{}',
    "topPerformingLectures" JSONB NOT NULL DEFAULT '[]',
    "strugglingStudents" INTEGER NOT NULL DEFAULT 0,
    "recommendedImprovements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentGaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "industryBenchmark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousPeriod" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lecture_ratings_userId_lectureId_key" ON "public"."lecture_ratings"("userId", "lectureId");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_analytics_lectureId_key" ON "public"."lecture_analytics"("lectureId");

-- CreateIndex
CREATE UNIQUE INDEX "course_analytics_courseId_key" ON "public"."course_analytics"("courseId");

-- AddForeignKey
ALTER TABLE "public"."lecture_resources" ADD CONSTRAINT "lecture_resources_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_ratings" ADD CONSTRAINT "lecture_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_ratings" ADD CONSTRAINT "lecture_ratings_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_issues" ADD CONSTRAINT "lecture_issues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_issues" ADD CONSTRAINT "lecture_issues_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_access_requests" ADD CONSTRAINT "lecture_access_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_access_requests" ADD CONSTRAINT "lecture_access_requests_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_transcripts" ADD CONSTRAINT "lecture_transcripts_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_summaries" ADD CONSTRAINT "lecture_summaries_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecture_analytics" ADD CONSTRAINT "lecture_analytics_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_analytics" ADD CONSTRAINT "course_analytics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
