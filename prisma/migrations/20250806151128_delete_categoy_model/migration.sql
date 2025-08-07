/*
  Warnings:

  - You are about to drop the column `categoryId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `subcategoryId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subcategories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_subcategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subcategories" DROP CONSTRAINT "subcategories_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."courses" DROP COLUMN "categoryId",
DROP COLUMN "subcategoryId",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "subcategory" TEXT;

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."subcategories";
