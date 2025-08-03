/*
  Warnings:

  - A unique constraint covering the columns `[paymentReference]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'Cancelled';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "paymentProviderId" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundStatus" "public"."RefundStatus",
ADD COLUMN     "refundTransactionId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrphanPayment" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "resolutionNote" TEXT,

    CONSTRAINT "OrphanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "public"."WebhookEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "OrphanPayment_reference_key" ON "public"."OrphanPayment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentReference_key" ON "public"."Order"("paymentReference");
