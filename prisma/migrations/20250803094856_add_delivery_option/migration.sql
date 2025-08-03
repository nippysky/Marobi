-- CreateEnum
CREATE TYPE "public"."DeliveryType" AS ENUM ('COURIER', 'PICKUP');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "deliveryDetails" JSONB,
ADD COLUMN     "deliveryFee" DOUBLE PRECISION,
ADD COLUMN     "deliveryOptionId" TEXT;

-- CreateTable
CREATE TABLE "public"."DeliveryOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "type" "public"."DeliveryType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "baseFee" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_deliveryOptionId_fkey" FOREIGN KEY ("deliveryOptionId") REFERENCES "public"."DeliveryOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
