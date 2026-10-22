import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";
import { DateTime } from "luxon";
import CONFIG from "@/config";

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  try {
    const { frenteNombre } = await req.json();

    if (!frenteNombre) {
      return NextResponse.json(
        { error: "El nombre del frente es obligatorio." },
        { status: 400 }
      );
    }

    // Gather metrics to decrement BEFORE deleting vouchers
    const vouchers = await prisma.voucherCamion.findMany({
      where: { frenteNombre },
      select: {
        voucherDatetime: true,
        status: true,
        cubicacion: true,
        turno: true,
      },
    });

    type DayKey = string;
    const metricsByDate = new Map<DayKey, {
      totalTrips: number;
      totalM3: number;
      turno1Arrived: number;
      turno2Arrived: number;
      totalVouchers: number;
    }>();

    for (const v of vouchers) {
      const cdmxDate = DateTime.fromJSDate(v.voucherDatetime)
        .setZone(CONFIG.TIMEZONE)
        .toISODate()!;
      const entry = metricsByDate.get(cdmxDate) ?? {
        totalTrips: 0, totalM3: 0, turno1Arrived: 0, turno2Arrived: 0, totalVouchers: 0,
      };
      entry.totalVouchers += 1;
      if (v.status === "ARRIVED") {
        entry.totalTrips += 1;
        entry.totalM3 += v.cubicacion;
        entry.turno1Arrived += v.turno === 1 ? 1 : 0;
        entry.turno2Arrived += v.turno === 2 ? 1 : 0;
      }
      metricsByDate.set(cdmxDate, entry);
    }

    const deleted = await prisma.voucherCamion.deleteMany({
      where: { frenteNombre },
    });

    // Decrement DashboardDailyMetrics per date
    await Promise.all(
      Array.from(metricsByDate.entries()).map(([date, m]) =>
        prisma.$executeRaw`
          UPDATE "DashboardDailyMetrics"
          SET "totalTrips"    = GREATEST("totalTrips" - ${m.totalTrips}, 0),
              "totalM3"       = GREATEST("totalM3" - ${m.totalM3}, 0),
              "turno1Arrived" = GREATEST("turno1Arrived" - ${m.turno1Arrived}, 0),
              "turno2Arrived" = GREATEST("turno2Arrived" - ${m.turno2Arrived}, 0),
              "totalVouchers" = GREATEST("totalVouchers" - ${m.totalVouchers}, 0),
              "updatedAt"     = NOW()
          WHERE "frenteNombre" = ${frenteNombre} AND "date" = ${date}
        `
      )
    );

    await invalidateDashboardCache(frenteNombre);
    await invalidateTrucksFacetsCache(frenteNombre);

    logSecurityEvent({
      type: SecurityEventType.DATA_DELETE,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      resource: "/api/trucks/deleteVoucher",
      details: { frenteNombre, count: deleted.count },
    });

    return NextResponse.json({
      message: `Se eliminaron ${deleted.count} registros para el frente ${frenteNombre}.`,
    });
  } catch (error) {
    console.error("Error al eliminar los registros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
