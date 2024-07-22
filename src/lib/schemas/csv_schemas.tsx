import { Gasolina, Acarreos } from "@prisma/client";

enum TipoTicket {
    ACARREOS = "ACARREOS",
    GASOLINA = "GASOLINA"
}

type CreateGasolinaDto = Omit<Gasolina, 'uuid' | 'createdAt'> & { tipoTicket: TipoTicket.GASOLINA };
type CreateAcarreosDto = Omit<Acarreos, 'uuid' | 'createdAt'> & { tipoTicket: TipoTicket.ACARREOS };

export type CreateTicketDto = CreateGasolinaDto | CreateAcarreosDto;

export function isCreateAcarreosDto(dto: CreateTicketDto): dto is CreateAcarreosDto {
    return dto.tipoTicket === TipoTicket.ACARREOS;
}

export function isCreateGasolinaDto(dto: CreateTicketDto): dto is CreateGasolinaDto {
    return dto.tipoTicket === TipoTicket.GASOLINA;
}

export const filteredDataConfig: Record<string, (data: any, fileName: string, cleanQuotes: (str: string) => string) => CreateTicketDto> = {
    acarreos: (data, fileName, cleanQuotes) => ({
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
        frenteNombre: fileName.substring(fileName.indexOf('_') + 1, fileName.indexOf('.')),
        tipoTicket: TipoTicket.ACARREOS,
    }),
    gasolina: (data, fileName, cleanQuotes) => ({
        empresa: cleanQuotes(data.empresa),
        direccion: cleanQuotes(data.direccion),
        litros: cleanQuotes(data.litros),
        fecha: cleanQuotes(data.fecha),
        placas: cleanQuotes(data.placas),
        noEstacion: cleanQuotes(data.noestacion),
        noNota: cleanQuotes(data.nonota),
        tipo: cleanQuotes(data.tipo),
        precio: cleanQuotes(data.precioUnitario),
        total: cleanQuotes(data.total),
        hora: cleanQuotes(data.hora),
        odometro: cleanQuotes(data.odometro),
        bomba: cleanQuotes(data.bomba),
        terminal: cleanQuotes(data.terminal),
        frenteNombre: fileName.substring(fileName.indexOf('_') + 1, fileName.indexOf('.')),
        tipoTicket: TipoTicket.GASOLINA,
    }),
};

