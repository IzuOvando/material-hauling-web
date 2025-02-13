-- AlterTable
ALTER TABLE "Frente" ADD COLUMN     "excelUrlAsfaltoBlob" TEXT;

-- CreateTable
CREATE TABLE "Asfalto" (
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frenteNombre" TEXT NOT NULL,
    "cubicacion" DOUBLE PRECISION NOT NULL,
    "material" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "planta" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "destino" TEXT NOT NULL,
    "tempAsfalto" DOUBLE PRECISION NOT NULL,
    "noEconomico" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "placas" TEXT NOT NULL,

    CONSTRAINT "Asfalto_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "Asfalto_frenteNombre_fecha_idx" ON "Asfalto"("frenteNombre", "fecha");

-- CreateIndex
CREATE INDEX "Asfalto_frenteNombre_empresa_idx" ON "Asfalto"("frenteNombre", "empresa");

-- CreateIndex
CREATE INDEX "Asfalto_frenteNombre_material_idx" ON "Asfalto"("frenteNombre", "material");

-- CreateIndex
CREATE INDEX "Asfalto_frenteNombre_noEconomico_idx" ON "Asfalto"("frenteNombre", "noEconomico");

-- CreateIndex
CREATE INDEX "Asfalto_frenteNombre_destino_idx" ON "Asfalto"("frenteNombre", "destino");

-- AddForeignKey
ALTER TABLE "Asfalto" ADD CONSTRAINT "Asfalto_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;
