-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('Privacy', 'Shipping', 'Refund');

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" TEXT,
    "subheadline" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChartEntry" (
    "id" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "chestMin" INTEGER NOT NULL,
    "chestMax" INTEGER NOT NULL,
    "waistMin" INTEGER NOT NULL,
    "waistMax" INTEGER NOT NULL,
    "chartId" TEXT NOT NULL,

    CONSTRAINT "SizeChartEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePolicy" (
    "id" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorePolicy_type_key" ON "StorePolicy"("type");

-- AddForeignKey
ALTER TABLE "SizeChartEntry" ADD CONSTRAINT "SizeChartEntry_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "SizeChart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
