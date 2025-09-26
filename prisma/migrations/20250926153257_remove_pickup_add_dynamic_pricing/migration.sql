/*
  Warnings:

  - The values [PICKUP] on the enum `DeliveryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."PricingMode" AS ENUM ('FIXED', 'DYNAMIC');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."DeliveryType_new" AS ENUM ('COURIER');
ALTER TABLE "public"."DeliveryOption" ALTER COLUMN "type" TYPE "public"."DeliveryType_new" USING ("type"::text::"public"."DeliveryType_new");
ALTER TYPE "public"."DeliveryType" RENAME TO "DeliveryType_old";
ALTER TYPE "public"."DeliveryType_new" RENAME TO "DeliveryType";
DROP TYPE "public"."DeliveryType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."DeliveryOption" ADD COLUMN     "pricingMode" "public"."PricingMode" NOT NULL DEFAULT 'FIXED',
ALTER COLUMN "type" SET DEFAULT 'COURIER',
ALTER COLUMN "baseFee" DROP NOT NULL;
