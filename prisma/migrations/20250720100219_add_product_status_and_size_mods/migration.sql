-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sizeMods" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'Draft';
