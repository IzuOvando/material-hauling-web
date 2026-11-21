/**
 * Single place that keeps DashboardDailyMetrics in sync with VoucherCamion.
 *
 * Rules every caller follows:
 * 1. Metrics change in the same transaction that inserts, updates or deletes the vouchers.
 * 2. Deltas come from the rows the database confirms it changed (`RETURNING`,
 *    `createManyAndReturn`), never from a read done beforehand.
 * 3. A voucher belongs to the CDMX calendar day of its `voucherDatetime`, like the dashboard.
 * 4. `totalVouchers` counts every voucher; trips, m³ and turnos count only ARRIVED ones.
 *
 * The mobile create/arrival routes predate this module and follow the same rules 3–4.
 */
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";
import type prisma from "@/lib/db";
import CONFIG from "@/config";
import { VoucherCamionStatus } from "@/types/enum";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";

type MetricsClient = Pick<typeof prisma, "$executeRaw">;

export type MetricsVoucher = {
  frenteNombre: string;
  voucherDatetime: Date;
  cubicacion: number;
  turno: number;
  status: string;
};

export const METRICS_RETURNING = Prisma.sql`"frenteNombre", "voucherDatetime", cubicacion, turno, status::text AS status`;

export const METRICS_SELECT = {
  frenteNombre: true,
  voucherDatetime: true,
  cubicacion: true,
  turno: true,
  status: true,
} as const;

/**
 * - `created`: new vouchers (+1 voucher each, plus a trip if already ARRIVED).
 * - `arrived`: IN_TRANSIT vouchers that just became ARRIVED (+1 trip, voucher already counted).
 * - `removed`: deleted vouchers (−1 voucher each, minus a trip if they were ARRIVED).
 */
export type MetricsEvent = "created" | "arrived" | "removed";

/** Bulk voucher operations can touch thousands of rows; Prisma's 5 s default is too short. */
export const METRICS_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 30_000 };

type DayDelta = {
  frenteNombre: string;
  date: string;
  vouchers: number;
  trips: number;
  m3: number;
  turno1: number;
  turno2: number;
};

function deltasByDay(event: MetricsEvent, vouchers: MetricsVoucher[]): DayDelta[] {
  const sign = event === "removed" ? -1 : 1;
  const byKey = new Map<string, DayDelta>();

  for (const v of vouchers) {
    const date = DateTime.fromJSDate(v.voucherDatetime).setZone(CONFIG.TIMEZONE).toISODate()!;
    const key = `${v.frenteNombre}|${date}`;
    const d = byKey.get(key) ?? {
      frenteNombre: v.frenteNombre, date, vouchers: 0, trips: 0, m3: 0, turno1: 0, turno2: 0,
    };

    if (event !== "arrived") d.vouchers += sign;
    if (event === "arrived" || v.status === VoucherCamionStatus.ARRIVED) {
      d.trips += sign;
      d.m3 += sign * v.cubicacion;
      if (v.turno === 1) d.turno1 += sign;
      else d.turno2 += sign;
    }
    byKey.set(key, d);
  }
  return Array.from(byKey.values());
}

export async function applyVoucherMetrics(
  tx: MetricsClient,
  event: MetricsEvent,
  vouchers: MetricsVoucher[],
): Promise<void> {
  for (const d of deltasByDay(event, vouchers)) {
    if (event === "removed") {
      await tx.$executeRaw`
        UPDATE "DashboardDailyMetrics"
        SET "totalVouchers" = GREATEST("totalVouchers" + ${d.vouchers}, 0),
            "totalTrips"    = GREATEST("totalTrips"    + ${d.trips}, 0),
            "totalM3"       = GREATEST("totalM3"       + ${d.m3}, 0),
            "turno1Arrived" = GREATEST("turno1Arrived" + ${d.turno1}, 0),
            "turno2Arrived" = GREATEST("turno2Arrived" + ${d.turno2}, 0),
            "updatedAt"     = NOW()
        WHERE "frenteNombre" = ${d.frenteNombre} AND "date" = ${d.date}
      `;
    } else {
      await tx.$executeRaw`
        INSERT INTO "DashboardDailyMetrics"
          ("frenteNombre", "date", "totalVouchers", "totalTrips", "totalM3", "turno1Arrived", "turno2Arrived", "updatedAt")
        VALUES
          (${d.frenteNombre}, ${d.date}, ${d.vouchers}, ${d.trips}, ${d.m3}, ${d.turno1}, ${d.turno2}, NOW())
        ON CONFLICT ("frenteNombre", "date") DO UPDATE
        SET "totalVouchers" = "DashboardDailyMetrics"."totalVouchers" + EXCLUDED."totalVouchers",
            "totalTrips"    = "DashboardDailyMetrics"."totalTrips"    + EXCLUDED."totalTrips",
            "totalM3"       = "DashboardDailyMetrics"."totalM3"       + EXCLUDED."totalM3",
            "turno1Arrived" = "DashboardDailyMetrics"."turno1Arrived" + EXCLUDED."turno1Arrived",
            "turno2Arrived" = "DashboardDailyMetrics"."turno2Arrived" + EXCLUDED."turno2Arrived",
            "updatedAt"     = NOW()
      `;
    }
  }
}

/** Call after the transaction commits. */
export async function refreshVoucherCaches(vouchers: MetricsVoucher[]): Promise<void> {
  const frentes = Array.from(new Set(vouchers.map((v) => v.frenteNombre)));
  await Promise.all(
    frentes.flatMap((f) => [invalidateDashboardCache(f), invalidateTrucksFacetsCache(f)]),
  );
}
