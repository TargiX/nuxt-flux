-- CreateTable
CREATE TABLE "Dream" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "data" JSONB NOT NULL,

    CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);
