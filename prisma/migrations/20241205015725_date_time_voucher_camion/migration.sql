/*
  Warnings:

  - Added the required column `voucherDate` to the `VoucherCamion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VoucherCamion" ADD COLUMN     "voucherDate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "VoucherCamion_createdAt_idx" ON "VoucherCamion"("createdAt");

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_voucherDate_idx" ON "VoucherCamion"("frenteNombre", "voucherDate");

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_voucherTime_idx" ON "VoucherCamion"("frenteNombre", "voucherTime");

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_idCamion_idx" ON "VoucherCamion"("frenteNombre", "idCamion");

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_origen_idx" ON "VoucherCamion"("frenteNombre", "origen");

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_tiro_idx" ON "VoucherCamion"("frenteNombre", "tiro");

-- CreateIndex
CREATE INDEX "VoucherCamion_frenteNombre_material_idx" ON "VoucherCamion"("frenteNombre", "material");
