/*
  Warnings:

  - A unique constraint covering the columns `[frenteKey]` on the table `Frente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Frente" ADD COLUMN     "frenteKey" TEXT,
ADD COLUMN     "logoHash" TEXT,
ADD COLUMN     "logoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "logoUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Frente_frenteKey_key" ON "Frente"("frenteKey");
