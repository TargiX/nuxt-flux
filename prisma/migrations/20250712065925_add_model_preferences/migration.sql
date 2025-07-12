-- AlterTable
ALTER TABLE "Dream" ADD COLUMN     "lastUsedModelId" TEXT;

-- CreateTable
CREATE TABLE "TagAppearance" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "TagAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModelPreference" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserModelPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TagAppearance_id_key" ON "TagAppearance"("id");

-- CreateIndex
CREATE INDEX "UserModelPreference_userId_idx" ON "UserModelPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserModelPreference_userId_modelId_key" ON "UserModelPreference"("userId", "modelId");

-- AddForeignKey
ALTER TABLE "UserModelPreference" ADD CONSTRAINT "UserModelPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
