/*
  Warnings:

  - You are about to drop the column `averageRating` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `ratingCount` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "averageRating",
DROP COLUMN "ratingCount";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;
