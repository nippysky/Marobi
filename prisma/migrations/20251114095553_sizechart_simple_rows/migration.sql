/*
  Warnings:

  - You are about to drop the `SizeChartEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SizeChartEntry" DROP CONSTRAINT "SizeChartEntry_chartId_fkey";

-- DropTable
DROP TABLE "SizeChartEntry";

-- CreateTable
CREATE TABLE "SizeChartRow" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "bodySize" TEXT NOT NULL,
    "productSize" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,

    CONSTRAINT "SizeChartRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SizeChartRow_chartId_order_idx" ON "SizeChartRow"("chartId", "order");

-- AddForeignKey
ALTER TABLE "SizeChartRow" ADD CONSTRAINT "SizeChartRow_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "SizeChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
