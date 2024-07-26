import { Gasolina, Acarreos } from "@prisma/client";
import { TicketArea } from "@/types";

type CreateGasolinaDto = Omit<Gasolina, "uuid" | "createdAt"> & {
  tipoTicket: TicketArea.GASOLINA;
};
type CreateAcarreosDto = Omit<Acarreos, "uuid" | "createdAt"> & {
  tipoTicket: TicketArea.ACARREOS;
};

export type CreateTicketDto = CreateGasolinaDto | CreateAcarreosDto;

export function isCreateAcarreosDto(
  dto: CreateTicketDto
): dto is CreateAcarreosDto {
  return dto.tipoTicket === TicketArea.ACARREOS;
}

export function isCreateGasolinaDto(
  dto: CreateTicketDto
): dto is CreateGasolinaDto {
  return dto.tipoTicket === TicketArea.GASOLINA;
}

export const filteredDataConfig: Record<
  string,
  (
    data: any,
    fileName: string,
    cleanQuotes: (str: string) => string
  ) => CreateTicketDto
> = {
  acarreos: (data, fileName, cleanQuotes) => ({
    folio: cleanQuotes(data.folio),
    empresa: cleanQuotes(data.empresa),
    material: cleanQuotes(data.material),
    cubicacion: cleanQuotes(data.cubicacion),
    fecha: cleanQuotes(data.fecha),
    placas: cleanQuotes(data.placas),
    idCamion: cleanQuotes(data.idCamion),
    operador: cleanQuotes(data.operador),
    proyecto: cleanQuotes(data.proyecto),
    noEmpleado: cleanQuotes(data.noEmpleado),
    checador: cleanQuotes(data.checador),
    hora: cleanQuotes(data.hora),
    banco: cleanQuotes(data.banco),
    frenteNombre: fileName.substring(
      fileName.indexOf("_") + 1,
      fileName.indexOf(".")
    ),
    tipoTicket: TicketArea.ACARREOS,
  }),
  gasolina: (data, fileName, cleanQuotes) => ({
    folio: cleanQuotes(data.folio),
    saldoCompra: cleanQuotes(data.saldoCompra),
    formatoPago: cleanQuotes(data.formatoPago),
    litros: cleanQuotes(data.litros),
    fecha: cleanQuotes(data.fecha),
    placas: cleanQuotes(data.placas),
    autorizacion: cleanQuotes(data.autorizacion),
    total: cleanQuotes(data.total),
    hora: cleanQuotes(data.hora),
    precioUnitario: cleanQuotes(data.precioUnitario),
    bomba: cleanQuotes(data.bomba),
    frenteNombre: fileName.substring(
      fileName.indexOf("_") + 1,
      fileName.indexOf(".")
    ),
    tipoTicket: TicketArea.GASOLINA,
  }),
};
