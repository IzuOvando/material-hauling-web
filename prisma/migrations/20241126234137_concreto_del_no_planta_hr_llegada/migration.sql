/*
  Warnings:

  - You are about to drop the column `horaLlegada` on the `Concreto` table. All the data in the column will be lost.
  - You are about to drop the column `noPlanta` on the `Concreto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Concreto" DROP COLUMN "horaLlegada",
DROP COLUMN "noPlanta";
