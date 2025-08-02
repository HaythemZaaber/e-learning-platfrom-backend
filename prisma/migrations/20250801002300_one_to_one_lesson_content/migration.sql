/*
  Warnings:

  - A unique constraint covering the columns `[lessonId]` on the table `content_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "content_items_lessonId_key" ON "content_items"("lessonId");
