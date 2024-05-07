/*
  Warnings:

  - A unique constraint covering the columns `[emailId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Email" ALTER COLUMN "emailId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Email_emailId_key" ON "Email"("emailId");
