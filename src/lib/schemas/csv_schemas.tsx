import { Gasolina, Acarreos } from "@prisma/client";
import { TicketArea } from "@/types";

type CreateGasolinaDto = Omit<Gasolina, 'uuid' | 'createdAt'> & {
  uuid?: string;
  tipoTicket: TicketArea.GASOLINA;
};

type CreateAcarreosDto = Omit<Acarreos, 'uuid' | 'createdAt'> & {
  uuid?: string;
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
  const regex = /(\d{1,2}) de (\w+) de (\d{4})/;
  const match = regex.exec(dateStr);
  if (!match) {
    throw new Error(`Fecha no válida: ${dateStr}`);
  }

  const day = parseInt(match[1], 10);
  const month = meses.indexOf(match[2].toLowerCase());
  const year = parseInt(match[3], 10);

  return new Date(year, month, day);
}

export const filteredDataConfig: Record<
  string,
  (
    data: any,
    fileName: string,
    cleanQuotes: (str: string) => string
  ) => CreateTicketDto
> = {
  acarreos: (data, fileName, cleanQuotes) => {
    const hora = parseHoraTime(cleanQuotes(data.hora))

    const [day, month, year] = cleanQuotes(data.fecha).split('-').map(part => parseInt(part, 10));
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
  gasolina: (data, fileName, cleanQuotes) => {
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
};