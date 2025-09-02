/*
  Warnings:

  - Added the required column `ejido` to the `VoucherCamion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VoucherCamion" ADD COLUMN     "ejido" TEXT NOT NULL;
