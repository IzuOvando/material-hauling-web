"use server";

import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";
import { kv } from "@vercel/kv";
import prisma from "@/lib/db";
import { getDashboardPeriodFilters, periodIncludesToday } from "./helpers";
import type {
  SummaryResponse,
  TimeseriesPoint,
  BreakdownItem,
  BreakdownGroupBy,
  DashboardPeriod,
  DashboardFilters,
} from "@/types/dashboard";
import CONFIG from "@/config";

function periodCacheKey(period: DashboardPeriod): string {
  switch (period.type) {
    case "week":  return `week-${period.weekStart}`;
    case "month": return `month-${period.year}-${period.month}`;
    case "year":  return `year-${period.year}`;
  }
}

function dashboardTTL(period: DashboardPeriod): number {
  return periodIncludesToday(period) ? 60 : 300;
}

export async function invalidateDashboardCache(frente: string): Promise<void> {
  try {
    const [, keys] = await kv.scan(0, { match: `dashboard:${frente}:*`, count: 1000 });
    if (keys.length > 0) await Promise.all(keys.map((k) => kv.del(k)));
  } catch (error) {
    console.error("Failed to invalidate dashboard cache", error);
  }
}

async function _getDashboardSummary(filters: DashboardFilters): Promise<SummaryResponse> {
  const fromDateStr = DateTime.fromJSDate(filters.dateFrom).setZone(CONFIG.TIMEZONE).toISODate()!;
  const toDateStr = DateTime.fromJSDate(filters.dateTo).setZone(CONFIG.TIMEZONE).toISODate()!;

  const aggregated = await prisma.dashboardDailyMetrics.aggregate({
    where: {
      frenteNombre: filters.frenteNombre,
      date: { gte: fromDateStr, lte: toDateStr },
    },
    _sum: { totalTrips: true, totalM3: true, turno1Arrived: true, turno2Arrived: true, totalVouchers: true },
  });

  const totalTrips = aggregated._sum.totalTrips ?? 0;
  const totalM3 = aggregated._sum.totalM3 ?? 0;
  const totalVouchers = aggregated._sum.totalVouchers ?? 0;

  return {
    totalTrips,
    totalM3,
    avgM3PerTrip: totalTrips > 0 ? totalM3 / totalTrips : 0,
    arrivalRate: totalVouchers > 0 ? (totalTrips / totalVouchers) * 100 : 0,
    turno1Arrived: aggregated._sum.turno1Arrived ?? 0,
    turno2Arrived: aggregated._sum.turno2Arrived ?? 0,
  };
}

export async function getDashboardSummary(frente: string, period: DashboardPeriod) {
  const key = `dashboard:${frente}:summary:${periodCacheKey(period)}`;
  const cached = await kv.get<SummaryResponse>(key);
  if (cached) return cached;
  const filters = getDashboardPeriodFilters(frente, period);
  const data = await _getDashboardSummary(filters);
  await kv.set(key, data, { ex: dashboardTTL(period) });
  return data;
}

async function _getDashboardTimeseries(
  filters: DashboardFilters,
  material?: string
): Promise<TimeseriesPoint[]> {
  const fromDateStr = DateTime.fromJSDate(filters.dateFrom).setZone(CONFIG.TIMEZONE).toISODate()!;
  const toDateStr = DateTime.fromJSDate(filters.dateTo).setZone(CONFIG.TIMEZONE).toISODate()!;

  type TurnoRow = { date: string; turno1: bigint; turno2: bigint };
  const turnoQuery = material
    ? prisma.$queryRaw<TurnoRow[]>(Prisma.sql`
        SELECT
          TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE ${CONFIG.TIMEZONE}, 'YYYY-MM-DD') AS date,
          COUNT(*) FILTER (WHERE turno = 1) AS turno1,
          COUNT(*) FILTER (WHERE turno = 2) AS turno2
        FROM "VoucherCamion"
        WHERE "frenteNombre" = ${filters.frenteNombre}
          AND status = 'ARRIVED'::"VoucherStatus"
          AND "voucherDatetime" >= ${filters.dateFrom} AND "voucherDatetime" <= ${filters.dateTo}
          AND immutable_unaccent(LOWER(TRIM(material))) = immutable_unaccent(LOWER(TRIM(${material})))
        GROUP BY 1`)
    : prisma.$queryRaw<TurnoRow[]>(Prisma.sql`
        SELECT
          TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE ${CONFIG.TIMEZONE}, 'YYYY-MM-DD') AS date,
          COUNT(*) FILTER (WHERE turno = 1) AS turno1,
          COUNT(*) FILTER (WHERE turno = 2) AS turno2
        FROM "VoucherCamion"
        WHERE "frenteNombre" = ${filters.frenteNombre}
          AND status = 'ARRIVED'::"VoucherStatus"
          AND "voucherDatetime" >= ${filters.dateFrom} AND "voucherDatetime" <= ${filters.dateTo}
        GROUP BY 1`);

  let rowMap: Map<string, TimeseriesPoint>;

  if (material) {
    type RawRow = { date: string; trips: bigint; m3: number };
    const [rows, turnoRows] = await Promise.all([
      prisma.$queryRaw<RawRow[]>(Prisma.sql`
        SELECT
          TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE ${CONFIG.TIMEZONE}, 'YYYY-MM-DD') AS date,
          COUNT(*) AS trips,
          COALESCE(SUM(cubicacion), 0) AS m3
        FROM "VoucherCamion"
        WHERE "frenteNombre" = ${filters.frenteNombre}
          AND status = 'ARRIVED'::"VoucherStatus"
          AND "voucherDatetime" >= ${filters.dateFrom} AND "voucherDatetime" <= ${filters.dateTo}
          AND immutable_unaccent(LOWER(TRIM(material))) = immutable_unaccent(LOWER(TRIM(${material})))
        GROUP BY 1 ORDER BY 1`),
      turnoQuery,
    ]);
    const turnoMap = new Map(turnoRows.map((r) => [r.date, r]));
    rowMap = new Map(
      rows.map((r) => {
        const t = turnoMap.get(r.date);
        return [r.date, { date: r.date, trips: Number(r.trips), m3: Number(r.m3), turno1: Number(t?.turno1 ?? 0), turno2: Number(t?.turno2 ?? 0) }];
      })
    );
  } else {
    const [rows, turnoRows] = await Promise.all([
      prisma.dashboardDailyMetrics.findMany({
        where: { frenteNombre: filters.frenteNombre, date: { gte: fromDateStr, lte: toDateStr } },
        orderBy: { date: "asc" },
        select: { date: true, totalTrips: true, totalM3: true },
      }),
      turnoQuery,
    ]);
    const turnoMap = new Map(turnoRows.map((r) => [r.date, r]));
    rowMap = new Map(
      rows.map((r) => {
        const t = turnoMap.get(r.date);
        return [r.date, { date: r.date, trips: r.totalTrips, m3: r.totalM3, turno1: Number(t?.turno1 ?? 0), turno2: Number(t?.turno2 ?? 0) }];
      })
    );
  }

  const result: TimeseriesPoint[] = [];
  let cursor = DateTime.fromISO(fromDateStr, { zone: CONFIG.TIMEZONE });
  const end = DateTime.fromISO(toDateStr, { zone: CONFIG.TIMEZONE });
  while (cursor <= end) {
    const d = cursor.toISODate()!;
    result.push(rowMap.get(d) ?? { date: d, trips: 0, m3: 0, turno1: 0, turno2: 0 });
    cursor = cursor.plus({ days: 1 });
  }

  return result;
}

export async function getDashboardTimeseries(
  frente: string,
  period: DashboardPeriod,
  material?: string
) {
  const matKey = material ? `-${material}` : "";
  const key = `dashboard:${frente}:timeseries:${periodCacheKey(period)}${matKey}`;
  const cached = await kv.get<TimeseriesPoint[]>(key);
  if (cached) return cached;
  const filters = getDashboardPeriodFilters(frente, period);
  const data = await _getDashboardTimeseries(filters, material);
  await kv.set(key, data, { ex: dashboardTTL(period) });
  return data;
}

async function _getDashboardBreakdown(
  filters: DashboardFilters,
  groupBy: BreakdownGroupBy
): Promise<BreakdownItem[]> {
  if (groupBy === "material") {
    type RawRow = { label: string; trips: bigint; m3: number };
    const rows: RawRow[] = await prisma.$queryRaw(Prisma.sql`
      SELECT immutable_unaccent(LOWER(TRIM(material))) AS label,
             COUNT(*) AS trips,
             COALESCE(SUM(cubicacion), 0) AS m3
      FROM "VoucherCamion"
      WHERE "frenteNombre" = ${filters.frenteNombre}
        AND status = 'ARRIVED'::"VoucherStatus"
        AND "voucherDatetime" >= ${filters.dateFrom} AND "voucherDatetime" <= ${filters.dateTo}
      GROUP BY immutable_unaccent(LOWER(TRIM(material)))
      ORDER BY m3 DESC
      LIMIT 20`);
    return rows.map((r) => ({ label: r.label, trips: Number(r.trips), m3: Number(r.m3) }));
  }

  if (groupBy === "departureChecker") {
    type RawRow = { label: string; trips: bigint; arrived: bigint; m3: number };
    const rows: RawRow[] = await prisma.$queryRaw(Prisma.sql`
      SELECT
        "checkerName"                                          AS label,
        COUNT(*)                                               AS trips,
        COUNT(*) FILTER (WHERE status = 'ARRIVED'::"VoucherStatus") AS arrived,
        COALESCE(SUM(cubicacion) FILTER (WHERE status = 'ARRIVED'::"VoucherStatus"), 0) AS m3
      FROM "VoucherCamion"
      WHERE "frenteNombre" = ${filters.frenteNombre}
        AND "voucherDatetime" >= ${filters.dateFrom}
        AND "voucherDatetime" <= ${filters.dateTo}
        AND "checkerName" IS NOT NULL AND "checkerName" <> ''
      GROUP BY "checkerName"
      ORDER BY COUNT(*) DESC
      LIMIT 20`);
    return rows.map((r) => ({
      label: r.label,
      trips: Number(r.trips),
      m3: Number(r.m3),
      rate: Number(r.trips) > 0 ? Math.round((Number(r.arrived) / Number(r.trips)) * 100) : 0,
    }));
  }

  // arrivalChecker
  type RawArrival = { label: string; trips: bigint; m3: number; avg_transit_min: number };
  const rows: RawArrival[] = await prisma.$queryRaw(Prisma.sql`
    SELECT
      "arrivalCheckerName"                                                         AS label,
      COUNT(*)                                                                     AS trips,
      COALESCE(SUM(cubicacion), 0)                                                 AS m3,
      ROUND(AVG(EXTRACT(EPOCH FROM ("arrivalTime" - "voucherDatetime")) / 60))::int AS avg_transit_min
    FROM "VoucherCamion"
    WHERE "frenteNombre" = ${filters.frenteNombre}
      AND status = 'ARRIVED'::"VoucherStatus"
      AND "arrivalCheckerName" IS NOT NULL AND "arrivalCheckerName" <> ''
      AND "arrivalTime" IS NOT NULL
      AND "voucherDatetime" >= ${filters.dateFrom}
      AND "voucherDatetime" <= ${filters.dateTo}
    GROUP BY "arrivalCheckerName"
    ORDER BY COUNT(*) DESC
    LIMIT 20`);
  return rows.map((r) => ({
    label: r.label,
    trips: Number(r.trips),
    m3: Number(r.m3),
    rate: Number(r.avg_transit_min),
  }));
}

export async function getDashboardBreakdown(
  frente: string,
  period: DashboardPeriod,
  groupBy: BreakdownGroupBy
) {
  const key = `dashboard:${frente}:breakdown:${periodCacheKey(period)}-${groupBy}`;
  const cached = await kv.get<BreakdownItem[]>(key);
  if (cached) return cached;
  const filters = getDashboardPeriodFilters(frente, period);
  const data = await _getDashboardBreakdown(filters, groupBy);
  await kv.set(key, data, { ex: dashboardTTL(period) });
  return data;
}
