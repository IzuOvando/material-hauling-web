/*
  Warnings:

  - You are about to drop the column `ubicacion` on the `Concreto` table. All the data in the column will be lost.
  - Added the required column `destino` to the `Concreto` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Concreto_frenteNombre_ubicacion_idx";

-- AlterTable
ALTER TABLE "Concreto" RENAME COLUMN "ubicacion" TO "destino";

-- CreateIndex
CREATE INDEX "Concreto_frenteNombre_destino_idx" ON "Concreto"("frenteNombre", "destino");
