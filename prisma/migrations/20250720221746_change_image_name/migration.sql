/*
  Warnings:

  - You are about to drop the column `profileImg` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "profileImg",
ADD COLUMN     "profileImage" TEXT;
