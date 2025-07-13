/*
  Warnings:

  - Added the required column `access` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "JobRole" AS ENUM ('DispatchCoordinator', 'OrderProcessingSpecialist', 'ProductCatalogManager', 'CustomerSupportRep');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SuperAdmin', 'ProductAdmin', 'OrderAdmin', 'DispatchUser', 'SupportUser');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "access" "UserRole" NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "JobRole" NOT NULL;
