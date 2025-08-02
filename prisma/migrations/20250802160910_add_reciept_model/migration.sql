-- CreateTable
CREATE TABLE "public"."ReceiptEmailStatus" (
    "orderId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptEmailStatus_pkey" PRIMARY KEY ("orderId")
);

-- AddForeignKey
ALTER TABLE "public"."ReceiptEmailStatus" ADD CONSTRAINT "ReceiptEmailStatus_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
