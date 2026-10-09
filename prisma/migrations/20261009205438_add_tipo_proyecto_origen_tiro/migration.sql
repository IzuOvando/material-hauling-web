-- CreateEnum
CREATE TYPE "TipoProyecto" AS ENUM ('LINEAL', 'FIJO');

-- AlterTable
ALTER TABLE "Frente" ADD COLUMN     "tipoProyecto" "TipoProyecto" NOT NULL DEFAULT 'FIJO';

-- CreateTable
CREATE TABLE "OrigenCatalogo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrigenCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrigenFrente" (
    "frenteNombre" TEXT NOT NULL,
    "origenId" TEXT NOT NULL,

    CONSTRAINT "OrigenFrente_pkey" PRIMARY KEY ("frenteNombre","origenId")
);

-- CreateTable
CREATE TABLE "TiroCatalogo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiroCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiroFrente" (
    "frenteNombre" TEXT NOT NULL,
    "tiroId" TEXT NOT NULL,

    CONSTRAINT "TiroFrente_pkey" PRIMARY KEY ("frenteNombre","tiroId")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrigenCatalogo_nombre_key" ON "OrigenCatalogo"("nombre");

-- CreateIndex
CREATE INDEX "OrigenFrente_frenteNombre_idx" ON "OrigenFrente"("frenteNombre");

-- CreateIndex
CREATE UNIQUE INDEX "TiroCatalogo_nombre_key" ON "TiroCatalogo"("nombre");

-- CreateIndex
CREATE INDEX "TiroFrente_frenteNombre_idx" ON "TiroFrente"("frenteNombre");

-- AddForeignKey
ALTER TABLE "OrigenFrente" ADD CONSTRAINT "OrigenFrente_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrigenFrente" ADD CONSTRAINT "OrigenFrente_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "OrigenCatalogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiroFrente" ADD CONSTRAINT "TiroFrente_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiroFrente" ADD CONSTRAINT "TiroFrente_tiroId_fkey" FOREIGN KEY ("tiroId") REFERENCES "TiroCatalogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
