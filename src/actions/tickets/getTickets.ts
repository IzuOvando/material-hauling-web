import prisma from "@/lib/db";
import { TicketArea } from "@/types";
import { Acarreos, Gasolina } from "@prisma/client";

const SORT_FIELDS = {
  [TicketArea.ACARREOS]: [
    "uuid",
    "folio",
    "fecha",
    "hora",
    "material",
    "cubicacion",
    "empresa",
    "banco",
    "placas",
    "idCamion",
    "operador",
    "noEmpleado",
    "checador",
    "proyecto",
  ],
  [TicketArea.GASOLINA]: [
    "folio",
    "fecha",
    "hora",
    "litros",
    "precioUnitario",
    "total",
    "placas",
    "bomba",
    "formatoPago",
    "autorizacion",
    "saldoCompra",
  ],
};

type PaginationConfig = {
  page: number;
  limit: number;
};

type getTicketReturn = {
  tickets: Acarreos[] | Gasolina[];
  total: number;
};

export default async function getTickets(
  frente: string,
  area: TicketArea,
  pagination: PaginationConfig,
  sort?: string
): Promise<getTicketReturn | null> {
  // Query variables
  const { page, limit } = pagination;
  let orderBy: any = undefined;
  // Return variables
  let tickets: Acarreos[] | Gasolina[] = [];
  let count = 0;

  // Validations
  if (![TicketArea.ACARREOS, TicketArea.GASOLINA].includes(area as TicketArea))
    return null;
  const frenteOnDB = await prisma.frente.findUnique({
    where: { nombre: frente },
  });
  if (!frenteOnDB) return null;

  // Add order/sorting
  if (sort) orderBy = getOrderBy(sort, area);

  // Query
  if (area === TicketArea.ACARREOS)
    [tickets, count] = await prisma.$transaction([
      prisma.acarreos.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          frenteNombre: frente,
        },
        orderBy,
      }),
      prisma.acarreos.count({
        where: {
          frenteNombre: frente,
        },
      }),
    ]);
  else
    [tickets, count] = await prisma.$transaction([
      prisma.gasolina.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          frenteNombre: frente,
        },
        orderBy,
      }),
      prisma.gasolina.count({
        where: {
          frenteNombre: frente,
        },
      }),
    ]);

  return {
    tickets,
    total: count,
  };
}

function getOrderBy(sort: string, area: TicketArea): any {
  const regex = /^([+-])(\w+)$/;
  const sortMatch = sort.match(regex);

  if (!sortMatch) return undefined;

  const sign = sortMatch[1];
  const field = sortMatch[2];

  if (!SORT_FIELDS[area].includes(field)) return undefined;

  return {
    [field]: sign === "-" ? "asc" : "desc",
  };
}
