/*
  Warnings:

  - The values [DOWNLOAD,INTERACTIVE,LIVE_SESSION,AR_VR,SCORM] on the enum `LectureType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LectureType_new" AS ENUM ('VIDEO', 'TEXT', 'AUDIO', 'QUIZ', 'IMAGE', 'DOCUMENT', 'RESOURCE', 'ASSIGNMENT');
ALTER TABLE "public"."lectures" ALTER COLUMN "type" TYPE "public"."LectureType_new" USING ("type"::text::"public"."LectureType_new");
ALTER TYPE "public"."LectureType" RENAME TO "LectureType_old";
ALTER TYPE "public"."LectureType_new" RENAME TO "LectureType";
DROP TYPE "public"."LectureType_old";
COMMIT;
