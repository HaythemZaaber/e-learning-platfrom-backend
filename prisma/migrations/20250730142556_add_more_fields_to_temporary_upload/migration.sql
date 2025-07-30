/*
  Warnings:

  - Added the required column `updatedAt` to the `temporary_uploads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "temporary_uploads" ADD COLUMN     "courseDraftId" TEXT,
ADD COLUMN     "lectureId" TEXT,
ADD COLUMN     "lectureTitle" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "sectionTitle" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
