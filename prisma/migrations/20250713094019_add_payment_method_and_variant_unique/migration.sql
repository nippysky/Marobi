/*
  Warnings:

  - A unique constraint covering the columns `[productId,color,size]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Variant_productId_color_size_key" ON "Variant"("productId", "color", "size");
