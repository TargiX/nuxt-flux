/*
  Warnings:

  - Added the required column `userId` to the `Dream` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dream" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GeneratedImage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "promptText" TEXT,
    "dreamId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GeneratedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedImage_dreamId_idx" ON "GeneratedImage"("dreamId");

-- CreateIndex
CREATE INDEX "GeneratedImage_userId_idx" ON "GeneratedImage"("userId");

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedImage" ADD CONSTRAINT "GeneratedImage_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedImage" ADD CONSTRAINT "GeneratedImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
