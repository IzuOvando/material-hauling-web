-- CreateTable
CREATE TABLE "Ticket" (
    "uuid" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "volumen" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "idCamion" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "checador" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QueryView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filterName" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_uuid_key" ON "Ticket"("uuid");
