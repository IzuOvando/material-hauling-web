import type { Prisma, VoucherStatus } from "@prisma/client";
import { DateTime } from "luxon";
import CONFIG from "@/config";

export const TRUCKS_FILTER_FIELDS = [
  "voucherDatetimeRange",
  "q",
  "status",
  "turno",
  "material",
  "checkerName",
  "arrivalCheckerName",
  "frenteNombre",
] as const;

export type TrucksFilterField = (typeof TRUCKS_FILTER_FIELDS)[number];

export const TRUCKS_SORT_FIELDS = [
  "folio",
  "idCamion",
  "placas",
  "noEconomico",
  "odometer",
  "odometerArrival",
  "status",
  "arrivalTime",
  "material",
  "cubicacion",
  "origen",
  "destino",
  "voucherDate",
  "voucherTime",
  "voucherDatetime",
  "operador",
  "noEmpleado",
  "turno",
  "localidad",
  "empresa",
  "checkerName",
  "checkerNo",
  "arrivalCheckerName",
  "arrivalCheckerEmployeeNumber",
  "createdAt",
] as const;

function parseFilterString(filters: string): Record<string, string[]> {
  const parsed: Record<string, string[]> = {};
  if (!filters) return parsed;
  filters.split("|").forEach((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) return;
    const field = part.slice(0, eqIdx).trim();
    const valStr = part.slice(eqIdx + 1).trim();
    const vals = valStr.split("^").map((v) => v.trim()).filter(Boolean);
    if (field && vals.length > 0) parsed[field] = vals;
  });
  return parsed;
}

function parseDateRange(value: string): { gte: Date; lte: Date } | null {
  const [fromStr, toStr] = value.split("..").map((s) => s.trim());
  if (!fromStr || !toStr) return null;
  const from = DateTime.fromISO(fromStr, { zone: CONFIG.TIMEZONE }).startOf("day");
  const to = DateTime.fromISO(toStr, { zone: CONFIG.TIMEZONE }).endOf("day");
  if (!from.isValid || !to.isValid) return null;
  return { gte: from.toUTC().toJSDate(), lte: to.toUTC().toJSDate() };
}

export function getTrucksFilters(
  filters: string | undefined | null
): Prisma.VoucherCamionWhereInput | null {
  if (!filters) return null;
  const parsed = parseFilterString(filters);
  const where: Prisma.VoucherCamionWhereInput = {};

  for (const field of Object.keys(parsed)) {
    if (!TRUCKS_FILTER_FIELDS.includes(field as TrucksFilterField)) continue;
    const values = parsed[field];

    if (field === "voucherDatetimeRange") {
      const range = parseDateRange(values[0]);
      if (range) where.voucherDatetime = range;
      continue;
    }

    if (field === "q") {
      const query = values[0];
      if (query) {
        where.OR = [
          { folio: { contains: query, mode: "insensitive" } },
          { noEconomico: { contains: query, mode: "insensitive" } },
        ];
      }
      continue;
    }

    if (field === "status") {
      const valid = values.filter((v): v is VoucherStatus =>
        v === "IN_TRANSIT" || v === "ARRIVED"
      );
      if (valid.length > 0) where.status = { in: valid };
      continue;
    }

    if (field === "turno") {
      const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
      if (nums.length > 0) where.turno = { in: nums };
      continue;
    }

    if (
      field === "material" ||
      field === "checkerName" ||
      field === "arrivalCheckerName" ||
      field === "frenteNombre"
    ) {
      (where as any)[field] = { in: values };
      continue;
    }
  }

  return Object.keys(where).length > 0 ? where : null;
}

export function getTrucksOrderBy(
  sort: string | undefined | null
): Prisma.VoucherCamionOrderByWithRelationInput | undefined {
  if (!sort) return undefined;
  const match = sort.match(/^([+-])(\w+)$/);
  if (!match) return undefined;
  const sign = match[1];
  const field = match[2];
  if (!TRUCKS_SORT_FIELDS.includes(field as (typeof TRUCKS_SORT_FIELDS)[number])) {
    return undefined;
  }
  const prismaField =
    field === "voucherDate" || field === "voucherTime" ? "voucherDatetime" : field;
  return {
    [prismaField]: sign === "-" ? "asc" : "desc",
  } as Prisma.VoucherCamionOrderByWithRelationInput;
}

