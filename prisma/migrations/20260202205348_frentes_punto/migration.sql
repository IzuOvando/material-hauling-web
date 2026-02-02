/*
  Warnings:

  - You are about to drop the column `ejido` on the `VoucherCamion` table. All the data in the column will be lost.
  - You are about to drop the column `tiro` on the `VoucherCamion` table. All the data in the column will be lost.
  - Added the required column `destino` to the `VoucherCamion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('IN_TRANSIT', 'ARRIVED');

-- DropIndex
DROP INDEX "VoucherCamion_frenteNombre_tiro_idx";

-- AlterTable
ALTER TABLE "VoucherCamion" DROP COLUMN "ejido",
DROP COLUMN "tiro",
ADD COLUMN     "arrivalTime" TIMESTAMP(3),
ADD COLUMN     "destino" TEXT NOT NULL,
ADD COLUMN     "localidad" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "odometerArrival" DOUBLE PRECISION,
ADD COLUMN     "status" "VoucherStatus" NOT NULL DEFAULT 'IN_TRANSIT',
ALTER COLUMN "odometer" SET DEFAULT 0,
ALTER COLUMN "odometer" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "UserFrente" (
    "userId" TEXT NOT NULL,
    "frenteNombre" TEXT NOT NULL,

    CONSTRAINT "UserFrente_pkey" PRIMARY KEY ("userId","frenteNombre")
);

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_destino_idx" ON "VoucherCamion"("frenteNombre", "destino");

-- AddForeignKey
ALTER TABLE "UserFrente" ADD CONSTRAINT "UserFrente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFrente" ADD CONSTRAINT "UserFrente_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;
