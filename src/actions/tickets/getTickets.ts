import prisma from "@/lib/db";
import { TicketArea } from "@/types";
import { Acarreos, Gasolina } from "@prisma/client";
import { getFilters, getOrderBy } from "./helpers";

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
  sort?: string,
  filters?: string
): Promise<getTicketReturn | null> {
  // Query variables
  const { page, limit } = pagination;
  let orderBy: any = undefined;
  let where: any = {
    frenteNombre: frente,
  };
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

  // Add filters on where
  if (filters) {
    const filtersOnWhere = getFilters(filters, area);
    if (filtersOnWhere) where = { ...where, AND: filtersOnWhere };
  }

  // Query
  if (area === TicketArea.ACARREOS)
    [tickets, count] = await prisma.$transaction([
      prisma.acarreos.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      prisma.acarreos.count({
        where,
      }),
    ]);
  else
    [tickets, count] = await prisma.$transaction([
      prisma.gasolina.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      prisma.gasolina.count({
        where,
      }),
    ]);

  return {
    tickets,
    total: count,
  };
}

// Validation should be done before calling this function
export async function getSomeTickets(
  uuids: string[],
  area: TicketArea,
  sort?: string
): Promise<Acarreos[] | Gasolina[]> {
  // Query variables
  let orderBy: any = undefined;

  // Return variables
  let tickets: Acarreos[] | Gasolina[] = [];

  // Add order/sorting
  if (sort) orderBy = getOrderBy(sort, area);

  if (area === TicketArea.ACARREOS)
    tickets = await prisma.acarreos.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
      orderBy,
    });
  else
    tickets = await prisma.gasolina.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
      orderBy,
    });

  return tickets;
}

export async function getAllTickets(
  frente: string,
  area: TicketArea,
  filters?: string,
  sort?: string
): Promise<Acarreos[] | Gasolina[]> {
  // Query variables
  let where: any = {
    frenteNombre: frente,
  };
  let orderBy: any = undefined;

  // Add filters on where
  if (filters) {
    const filtersOnWhere = getFilters(filters, area);
    if (filtersOnWhere) where = { ...where, AND: filtersOnWhere };
  }

  // Add order/sorting
  if (sort) orderBy = getOrderBy(sort, area);

  // Return variables
  let tickets: Acarreos[] | Gasolina[] = [];

  if (area === TicketArea.ACARREOS)
    tickets = await prisma.acarreos.findMany({
      where,
      orderBy,
    });
  else
    tickets = await prisma.gasolina.findMany({
      where,
      orderBy,
    });

  return tickets;
}
