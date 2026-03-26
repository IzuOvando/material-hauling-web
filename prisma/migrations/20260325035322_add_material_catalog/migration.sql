-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialFrente" (
    "materialId" TEXT NOT NULL,
    "frenteNombre" TEXT NOT NULL,

    CONSTRAINT "MaterialFrente_pkey" PRIMARY KEY ("materialId","frenteNombre")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_nombre_key" ON "Material"("nombre");

-- CreateIndex
CREATE INDEX "MaterialFrente_frenteNombre_idx" ON "MaterialFrente"("frenteNombre");

-- AddForeignKey
ALTER TABLE "MaterialFrente" ADD CONSTRAINT "MaterialFrente_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialFrente" ADD CONSTRAINT "MaterialFrente_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;
