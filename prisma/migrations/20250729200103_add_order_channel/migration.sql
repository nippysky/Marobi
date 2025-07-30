/*
  Warnings:

  - Made the column `hipMax` on table `SizeChartEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hipMin` on table `SizeChartEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "channel" "OrderChannel" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "hasSizeMod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sizeModFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SizeChartEntry" ALTER COLUMN "hipMax" SET NOT NULL,
ALTER COLUMN "hipMin" SET NOT NULL;
