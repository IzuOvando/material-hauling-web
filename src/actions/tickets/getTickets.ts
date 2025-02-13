import prisma from "@/lib/db";
import { Section, TicketArea } from "@/types";
import { Acarreos, Gasolina, Concreto, VoucherCamion, Asfalto } from "@prisma/client";
import { getFilters, getOrderBy } from "./helpers";

type PaginationConfig = {
  page: number;
  limit: number;
};

type TicketsType = Acarreos[] | Gasolina[] | Concreto[] | Asfalto[] | VoucherCamion[];

type getTicketReturn = {
  tickets: TicketsType;
  total: number;
};

export default async function getTickets(
  frente: string,
  area: TicketArea | Section,
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
  let tickets: TicketsType = [];
  let count = 0;

  // Validations
  if (
    ![
      TicketArea.ACARREOS,
      TicketArea.GASOLINA,
      TicketArea.CONCRETO,
      TicketArea.ASFALTO,
      Section.VOUCHERCAMION,
    ].includes(area as TicketArea)
  )
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
  else if (area === TicketArea.GASOLINA)
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
  else if (area === TicketArea.CONCRETO)
    [tickets, count] = await prisma.$transaction([
      prisma.concreto.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      prisma.concreto.count({
        where,
      }),
    ]);
  else if (area === TicketArea.ASFALTO)
    [tickets, count] = await prisma.$transaction([
      prisma.asfalto.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      prisma.asfalto.count({
        where,
      }),
    ]);
  else
    [tickets, count] = await prisma.$transaction([
      prisma.voucherCamion.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      prisma.voucherCamion.count({
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
): Promise<TicketsType> {
  // Query variables
  let orderBy: any = undefined;

  // Return variables
  let tickets: TicketsType = [];

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
  else if (area === TicketArea.GASOLINA)
    tickets = await prisma.gasolina.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
      orderBy,
    });
  else if (area === TicketArea.ASFALTO)
    tickets = await prisma.asfalto.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
      orderBy,
    });
  else
    tickets = await prisma.concreto.findMany({
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
): Promise<TicketsType> {
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
  let tickets: TicketsType = [];

  if (area === TicketArea.ACARREOS)
    tickets = await prisma.acarreos.findMany({
      where,
      orderBy,
    });
  else if (area === TicketArea.GASOLINA)
    tickets = await prisma.gasolina.findMany({
      where,
      orderBy,
    });
  else if (area === TicketArea.ASFALTO)
    tickets = await prisma.asfalto.findMany({
      where,
      orderBy,
    });
  else
    tickets = await prisma.concreto.findMany({
      where,
      orderBy,
    });
  return tickets;
}
