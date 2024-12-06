import { Gasolina, Acarreos, Concreto } from "@prisma/client";
import { TicketArea } from "@/types";
import { DateTime } from 'luxon';

type CreateGasolinaDto = Omit<Gasolina, "uuid" | "createdAt"> & {
  uuid?: string;
  tipoTicket: TicketArea.GASOLINA;
};

type CreateAcarreosDto = Omit<Acarreos, "uuid" | "createdAt"> & {
  uuid?: string;
  tipoTicket: TicketArea.ACARREOS;
};

type CreateConcretoDto = Omit<Concreto, "uuid" | "createdAt"> & {
  uuid?: string;
  tipoTicket: TicketArea.CONCRETO;
};
export type CreateTicketDto =
  | CreateGasolinaDto
  | CreateAcarreosDto
  | CreateConcretoDto;

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

export function isCreateConcretoaDto(
  dto: CreateTicketDto
): dto is CreateConcretoDto {
  return dto.tipoTicket === TicketArea.CONCRETO;
}

function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",");
}

function parseHoraTime(dateStr: string): Date {

  const normalizedDateStr = dateStr.replace(/\./g, "").toLowerCase();
  const [time, period] = normalizedDateStr.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedTime = `${hours}:${formattedMinutes} ${period}`;
  const dateTime = DateTime.fromFormat(formattedTime, "h:mm a", { zone: "UTC" });

  if (!dateTime.isValid) {
    throw new Error("Formato de hora inválido");
  }
  return dateTime.toJSDate();
}

function parseUTCDate(dateStr: string): Date {

  const date = DateTime.fromISO(dateStr, { zone: 'utc' });
  if (date.isValid) {
    return date.toJSDate();
  }

  const isDDMMYYYY = /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);

  if (isDDMMYYYY) {
    const [dd, mm, yyyy] = dateStr.split('/');
    dateStr = `${mm}/${parseInt(dd)}/${yyyy.slice(-2)}`;
  }
  const parsedDate = DateTime.fromFormat(dateStr, 'M/d/yy', { zone: 'utc' });

  if (!parsedDate.isValid) {
      throw new Error(`Invalid date format: ${dateStr}`);
  }

  return parsedDate.toJSDate();
}

function normalizeKeysToLowerCase<T>(data: T): T {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => normalizeKeysToLowerCase(item)) as T;
  }

  return Object.keys(data).reduce((acc, key) => {
    const normalizedKey = key.toLowerCase();
    const value = (data as Record<string, unknown>)[key];
    (acc as Record<string, unknown>)[normalizedKey] =
      normalizeKeysToLowerCase(value);
    return acc;
  }, {} as T);
}

export const filteredDataConfig: Record<
  string,
  (
    data: any,
    fileName: string,
    cleanQuotes: (str: string) => string
  ) => CreateTicketDto
> = {
  acarreos: (rawData, fileName, cleanQuotes) => {
    const data = normalizeKeysToLowerCase(rawData);
    const hora = parseHoraTime(cleanQuotes(data.hora));

    const fechaStr = cleanQuotes(data.fecha);

    const fecha = parseUTCDate(fechaStr);

    return {
      uuid: cleanQuotes(data.uuid),
      folio: parseInt(cleanQuotes(data.folio)),
      empresa: cleanQuotes(data.empresa),
      material: cleanQuotes(data.material),
      cubicacion: parseFloat(cleanQuotes(data.cubicacion)),
      fecha: fecha,
      placas: cleanQuotes(data.placas),
      idCamion: cleanQuotes(data.idcamion),
      operador: cleanQuotes(data.operador),
      proyecto: cleanQuotes(data.proyecto),
      noEmpleado: cleanQuotes(data.noempleado),
      checador: cleanQuotes(data.checador),
      hora: hora,
      banco: cleanQuotes(data.banco),
      frenteNombre: fileName.substring(
        fileName.indexOf("_") + 1,
        fileName.indexOf(".")
      ),
      tipoTicket: TicketArea.ACARREOS,
    };
  },
  gasolina: (rawData, fileName, cleanQuotes) => {
    const data = normalizeKeysToLowerCase(rawData);
    const hora = parseHoraTime(cleanQuotes(data.hora));

    const fechaStr = cleanQuotes(data.fecha);

    const fecha = parseUTCDate(fechaStr);

    const parseCurrency = (value: string): number => {
      const cleanedValue = value.replace(/[\$,]/g, "");
      return parseFloat(cleanedValue);
    };
    return {
      uuid: cleanQuotes(data.uuid),
      folio: cleanQuotes(data.folio),
      saldoCompra: parseCurrency(cleanQuotes(data.saldocompra)),
      formatoPago: cleanQuotes(data.formatopago),
      litros: parseFloat(cleanQuotes(data.litros)),
      fecha: fecha,
      placas: cleanQuotes(data.placas),
      autorizacion: cleanQuotes(data.autorizacion),
      total: parseCurrency(cleanQuotes(data.total)),
      hora: hora,
      precioUnitario: parseCurrency(cleanQuotes(data.preciounitario)),
      bomba: parseInt(cleanQuotes(data.bomba), 10),
      frenteNombre: fileName.substring(
        fileName.indexOf("_") + 1,
        fileName.indexOf(".")
      ),
      tipoTicket: TicketArea.GASOLINA,
    };
  },
  concreto: (rawData, fileName, cleanQuotes) => {
    const data = normalizeKeysToLowerCase(rawData);
    const horaSalida = parseHoraTime(cleanQuotes(data.horasalida));

    const fechaStr = cleanQuotes(data.fecha);

    const fecha = parseUTCDate(fechaStr);

    return {
      uuid: cleanQuotes(data.uuid),
      cubicacion: parseFloat(cleanQuotes(data.cubicacion)),
      cliente: cleanQuotes(data.cliente),
      empresa: cleanQuotes(data.empresa),
      fecha: fecha,
      planta: cleanQuotes(data.planta),
      operador: cleanQuotes(data.operador),
      fc: cleanQuotes(data.fc),
      uso: cleanQuotes(data.uso),
      destino: normalizeValue(cleanQuotes(data.destino)),
      rev: parseInt(cleanQuotes(data.rev)),
      tempConcreto: parseFloat(cleanQuotes(data.tempconcreto)),
      tempAmbiente: parseFloat(cleanQuotes(data.tempambiente)),
      noEconomico: cleanQuotes(data.noeconomico),
      marca: cleanQuotes(data.marca),
      elemento: normalizeValue(cleanQuotes(data.elemento)),
      horaSalida: horaSalida,
      placas: cleanQuotes(data.placas),
      frenteNombre: fileName.substring(
        fileName.indexOf("_") + 1,
        fileName.indexOf(".")
      ),
      tipoTicket: TicketArea.CONCRETO,
    };
  },
};
