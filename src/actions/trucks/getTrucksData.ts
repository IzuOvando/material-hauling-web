import prisma from "@/lib/db";
import { VoucherCamion } from "@prisma/client";
import { getTrucksFilters, getTrucksOrderBy } from "./filters";

interface PaginationConfig {
  page: number;
  limit: number;
}

interface GetTrucksDataResult {
  vouchers: VoucherCamion[];
  total: number;
}

export async function getTrucksData(
  frente: string,
  filters: string | undefined,
  pagination: PaginationConfig,
  sort?: string
): Promise<GetTrucksDataResult | null> {
  const frenteOnDB = await prisma.frente.findUnique({
    where: { nombre: frente },
  });
  if (!frenteOnDB) return null;

  const { page, limit } = pagination;
  const orderBy = getTrucksOrderBy(sort);
  const extra = getTrucksFilters(filters);

  const where: any = { frenteNombre: frente };
  if (extra) where.AND = extra;

  const [vouchers, total] = await prisma.$transaction([
    prisma.voucherCamion.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: orderBy ?? { voucherDatetime: "desc" },
    }),
    prisma.voucherCamion.count({ where }),
  ]);

  return { vouchers, total };
}

export async function getAllTrucksForExport(
  frente: string,
  filters: string | undefined,
  sort?: string
): Promise<VoucherCamion[]> {
  const orderBy = getTrucksOrderBy(sort);
  const extra = getTrucksFilters(filters);

  const where: any = { frenteNombre: frente };
  if (extra) where.AND = extra;

  return prisma.voucherCamion.findMany({
    where,
    orderBy: orderBy ?? { voucherDatetime: "desc" },
  });
}
