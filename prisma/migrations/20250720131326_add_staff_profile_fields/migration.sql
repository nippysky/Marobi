-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfEmployment" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfResignation" TIMESTAMP(3),
ADD COLUMN     "emailPersonal" TEXT,
ADD COLUMN     "guarantorAddress" TEXT,
ADD COLUMN     "guarantorName" TEXT,
ADD COLUMN     "guarantorPhone" TEXT,
ADD COLUMN     "middleName" TEXT DEFAULT '';
