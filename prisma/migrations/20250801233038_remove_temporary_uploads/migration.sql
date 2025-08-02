/*
  Warnings:

  - You are about to drop the `temporary_uploads` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "temporary_uploads" DROP CONSTRAINT "temporary_uploads_userId_fkey";

-- DropTable
DROP TABLE "temporary_uploads";
