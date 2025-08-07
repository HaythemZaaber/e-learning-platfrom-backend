-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "isBestseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTrending" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalCourses" INTEGER DEFAULT 0,
ADD COLUMN     "totalStudents" INTEGER DEFAULT 0;
