/*
  Warnings:

  - Added the required column `placas` to the `Concreto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Concreto" ADD COLUMN     "placas" TEXT NOT NULL;
