import { Gasolina, Acarreos, Concreto } from "@prisma/client";
import { TicketArea } from "@/types";

type CreateGasolinaDto = Omit<Gasolina, 'uuid' | 'createdAt'> & {
  uuid?: string;
  tipoTicket: TicketArea.GASOLINA;
};

type CreateAcarreosDto = Omit<Acarreos, 'uuid' | 'createdAt'> & {
  uuid?: string;
  tipoTicket: TicketArea.ACARREOS;
};

type CreateConcretoDto = Omit<Concreto, 'uuid' | 'createdAt'> & {
  uuid?: string;
  tipoTicket: TicketArea.CONCRETO;
};
export type CreateTicketDto = CreateGasolinaDto | CreateAcarreosDto | CreateConcretoDto;

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
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',');
}

function parseHoraTime(dateStr: string): Date {
  const [time, period] = dateStr.split(" ");
  const [hours, minutes] = time.split(":").map(Number);

  let adjustedHours = hours;

  if (period.toLowerCase() === "p." || period.toLowerCase() === "pm") {
    if (hours !== 12) {
      adjustedHours += 12;
    }
  } else if (period.toLowerCase() === "a." || period.toLowerCase() === "am") {
    if (hours === 12) {
      adjustedHours = 0;
    }
  }
  const date = new Date(0);
  date.setUTCHours(adjustedHours, minutes, 0, 0);

  return date;
}
const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function parseSpanishDate(dateStr: string): Date {

  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const ddmmyyyyMatch = ddmmyyyyRegex.exec(dateStr);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);
    return new Date(year, month - 1, day);
  }

  const spanishDateRegex = /(\d{1,2}) de (\w+) de (\d{4})/;
  const spanishMatch = spanishDateRegex.exec(dateStr);
  if (spanishMatch) {
    const day = parseInt(spanishMatch[1], 10);
    const month = meses.indexOf(spanishMatch[2].toLowerCase());
    const year = parseInt(spanishMatch[3], 10);
    return new Date(year, month, day);
  }

  throw new Error(`Fecha no válida: ${dateStr}`);
}

function normalizeKeysToLowerCase<T>(data: T): T {

  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => normalizeKeysToLowerCase(item)) as T;
  }

  return Object.keys(data).reduce((acc, key) => {
    const normalizedKey = key.toLowerCase();
    const value = (data as Record<string, unknown>)[key];
    (acc as Record<string, unknown>)[normalizedKey] = normalizeKeysToLowerCase(value);
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
    const hora = parseHoraTime(cleanQuotes(data.hora))

    const fechaStr = cleanQuotes(data.fecha);

    const [month, day, year] = fechaStr.split('-').map(part => parseInt(part, 10));

    const fecha = new Date(year, month - 1, day);

    return {
      uuid: cleanQuotes(data.uuid),
      folio: parseInt(cleanQuotes(data.folio)),
      empresa: cleanQuotes(data.empresa),
      material: cleanQuotes(data.material),
      cubicacion: parseFloat(cleanQuotes(data.cubicacion)),
      fecha: fecha,
      placas: cleanQuotes(data.placas),
      idCamion: cleanQuotes(data.idCamion),
      operador: cleanQuotes(data.operador),
      proyecto: cleanQuotes(data.proyecto),
      noEmpleado: cleanQuotes(data.noEmpleado),
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
    const hora = parseHoraTime(cleanQuotes(data.hora))

    const fecha = parseSpanishDate(cleanQuotes(data.fecha));

    const parseCurrency = (value: string): number => {
      const cleanedValue = value.replace(/[\$,]/g, '');
      return parseFloat(cleanedValue);
    };
    return {
      uuid: cleanQuotes(data.uuid),
      folio: cleanQuotes(data.folio),
      saldoCompra: parseCurrency(cleanQuotes(data.saldoCompra)),
      formatoPago: cleanQuotes(data.formatoPago),
      litros: parseFloat(cleanQuotes(data.litros)),
      fecha: fecha,
      placas: cleanQuotes(data.placas),
      autorizacion: cleanQuotes(data.autorizacion),
      total: parseCurrency(cleanQuotes(data.total)),
      hora: hora,
      precioUnitario: parseCurrency(cleanQuotes(data.precioUnitario)),
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
    const horaSalida = parseHoraTime(cleanQuotes(data.horasalida))
    const horaLlegada = parseHoraTime(cleanQuotes(data.horallegada))

    const fechaStr = cleanQuotes(data.fecha);

    const [day, month, year] = fechaStr.split('-').map(part => parseInt(part, 10));

    const fecha = new Date(year, month - 1, day);

    return {
      uuid: cleanQuotes(data.uuid),
      folio: cleanQuotes(data.folio),
      cubicacion: parseFloat(cleanQuotes(data.cubicacion)),
      cliente: cleanQuotes(data.cliente),
      empresa: cleanQuotes(data.empresa),
      fecha: fecha,
      noPlanta: cleanQuotes(data.noplanta),
      planta: cleanQuotes(data.planta),
      operador: cleanQuotes(data.operador),
      fc: cleanQuotes(data.fc),
      uso: cleanQuotes(data.uso),
      ubicacion: normalizeValue(cleanQuotes(data.ubicacion)),
      rev: parseInt(cleanQuotes(data.rev)),
      tempConcreto: parseFloat(cleanQuotes(data.tempconcreto)),
      tempAmbiente: parseFloat(cleanQuotes(data.tempambiente)),
      noEconomico: cleanQuotes(data.noeconomico),
      marca: cleanQuotes(data.marca),
      elemento: normalizeValue(cleanQuotes(data.elemento)),
      horaSalida: horaSalida,
      horaLlegada: horaLlegada,
      frenteNombre: fileName.substring(
        fileName.indexOf("_") + 1,
        fileName.indexOf(".")
      ),
      tipoTicket: TicketArea.CONCRETO,
    };
  },
};