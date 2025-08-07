-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "hasLiveSessions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasRecordings" BOOLEAN NOT NULL DEFAULT false;
