/*
  Warnings:

  - You are about to drop the column `role` on the `Staff` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "JobRole" ADD VALUE 'SystemAdministrator';

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "role",
ADD COLUMN     "jobRoles" "JobRole"[] DEFAULT ARRAY[]::"JobRole"[];
