-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "title" TEXT;
