-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Frente" (
    "nombre" TEXT NOT NULL,
    "excelUrlGasolinaBlob" TEXT,
    "excelUrlAcarreosBlob" TEXT,

    CONSTRAINT "Frente_pkey" PRIMARY KEY ("nombre")
);

-- CreateTable
CREATE TABLE "VoucherCamion" (
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voucherTime" TIMESTAMP(3) NOT NULL,
    "tiro" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "placas" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "turno" INTEGER NOT NULL,
    "noEconomico" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cubicacion" DOUBLE PRECISION NOT NULL,
    "checkerName" TEXT NOT NULL,
    "noEmpleado" TEXT NOT NULL,
    "checkerNo" TEXT,
    "frenteNombre" TEXT NOT NULL,
    "idCamion" TEXT NOT NULL,

    CONSTRAINT "VoucherCamion_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Acarreos" (
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folio" INTEGER NOT NULL,
    "frenteNombre" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "cubicacion" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "placas" TEXT NOT NULL,
    "noEmpleado" TEXT NOT NULL,
    "idCamion" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "checador" TEXT NOT NULL,
    "hora" TIMESTAMP(3) NOT NULL,
    "proyecto" TEXT NOT NULL,
    "banco" TEXT NOT NULL,

    CONSTRAINT "Acarreos_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Gasolina" (
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folio" TEXT NOT NULL,
    "frenteNombre" TEXT NOT NULL,
    "saldoCompra" DOUBLE PRECISION NOT NULL,
    "formatoPago" TEXT NOT NULL,
    "autorizacion" TEXT NOT NULL,
    "litros" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "placas" TEXT NOT NULL,
    "hora" TIMESTAMP(3) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "bomba" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Gasolina_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Concreto" (
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folio" TEXT NOT NULL,
    "frenteNombre" TEXT NOT NULL,
    "cubicacion" DOUBLE PRECISION NOT NULL,
    "cliente" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "noPlanta" TEXT NOT NULL,
    "planta" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fc" INTEGER NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "tempConcreto" DOUBLE PRECISION NOT NULL,
    "tempAmbiente" DOUBLE PRECISION NOT NULL,
    "noEconomico" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "elemento" TEXT NOT NULL,
    "horaSalida" TIMESTAMP(3) NOT NULL,
    "horaLlegada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concreto_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Frente_nombre_key" ON "Frente"("nombre");

-- CreateIndex
CREATE INDEX "Acarreos_frenteNombre_fecha_idx" ON "Acarreos"("frenteNombre", "fecha");

-- CreateIndex
CREATE INDEX "Acarreos_frenteNombre_idCamion_idx" ON "Acarreos"("frenteNombre", "idCamion");

-- CreateIndex
CREATE INDEX "Acarreos_frenteNombre_empresa_idx" ON "Acarreos"("frenteNombre", "empresa");

-- CreateIndex
CREATE INDEX "Acarreos_frenteNombre_material_idx" ON "Acarreos"("frenteNombre", "material");

-- CreateIndex
CREATE INDEX "Gasolina_frenteNombre_fecha_idx" ON "Gasolina"("frenteNombre", "fecha");

-- CreateIndex
CREATE INDEX "Gasolina_frenteNombre_placas_idx" ON "Gasolina"("frenteNombre", "placas");

-- CreateIndex
CREATE INDEX "Gasolina_frenteNombre_bomba_idx" ON "Gasolina"("frenteNombre", "bomba");

-- CreateIndex
CREATE INDEX "Concreto_frenteNombre_fecha_idx" ON "Concreto"("frenteNombre", "fecha");

-- CreateIndex
CREATE INDEX "Concreto_frenteNombre_elemento_idx" ON "Concreto"("frenteNombre", "elemento");

-- CreateIndex
CREATE INDEX "Concreto_frenteNombre_empresa_idx" ON "Concreto"("frenteNombre", "empresa");

-- CreateIndex
CREATE INDEX "Concreto_frenteNombre_noEconomico_idx" ON "Concreto"("frenteNombre", "noEconomico");

-- CreateIndex
CREATE INDEX "Concreto_frenteNombre_ubicacion_idx" ON "Concreto"("frenteNombre", "ubicacion");

-- AddForeignKey
ALTER TABLE "VoucherCamion" ADD CONSTRAINT "VoucherCamion_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acarreos" ADD CONSTRAINT "Acarreos_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasolina" ADD CONSTRAINT "Gasolina_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concreto" ADD CONSTRAINT "Concreto_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;
