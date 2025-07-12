-- CreateTable
CREATE TABLE "TagAppearance" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "TagAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TagAppearance_id_key" ON "TagAppearance"("id");
