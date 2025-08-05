/*
  Warnings:

  - The values [LINK,PRESENTATION,SPREADSHEET,EBOOK] on the enum `ContentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContentType_new" AS ENUM ('VIDEO', 'AUDIO', 'DOCUMENT', 'TEXT', 'QUIZ', 'ASSIGNMENT', 'RESOURCE', 'IMAGE', 'ARCHIVE');
ALTER TABLE "content_items" ALTER COLUMN "type" TYPE "ContentType_new" USING ("type"::text::"ContentType_new");
ALTER TYPE "ContentType" RENAME TO "ContentType_old";
ALTER TYPE "ContentType_new" RENAME TO "ContentType";
DROP TYPE "ContentType_old";
COMMIT;
