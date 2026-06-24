import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import { VoucherCamionStatus } from "@/types/enum";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";
import CONFIG from "@/config";

type ArrivalUpdateInput = {
  folio:                         string;
  arrivalTime:                   string;
  odometerArrival:               number | string;
  latitude?:                     number | null;
  longitude?:                    number | null;
  locationAccuracy?:             number | null;
  locationTimestamp?:            string | null;
  locationStatus?:               string | null;
  locationSource?:               string | null;
  arrivalCheckerName?:           string | null;
  arrivalCheckerEmployeeNumber?: string | null;
};

type ArrivalBatchBody = {
  updates: ArrivalUpdateInput[];
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
    return NextResponse.json(
      { message: "No autorizado, proporcione credenciales válidas para realizar esta acción" },
      { status: 401 }
    );
  }

  const decoded = TokenAuthenticator.decode(accessToken);
  if (!decoded) {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  let body: ArrivalBatchBody;
  try {
    body = (await req.json()) as ArrivalBatchBody;
  } catch {
    return NextResponse.json({ error: "Formato JSON inválido" }, { status: 400 });
  }

  if (!body?.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
    return NextResponse.json(
      { error: "No se proporcionaron actualizaciones de llegada (updates)" },
      { status: 400 }
    );
  }

  const normalized: {
    folio:                         string;
    arrivalTime:                   Date;
    odometerArrival:               number;
    arrivalLatitude:               number | null;
    arrivalLongitude:              number | null;
    arrivalLocationAccuracy:       number | null;
    arrivalLocationTimestamp:      Date | null;
    arrivalLocationStatus:         string | null;
    arrivalLocationSource:         string | null;
    arrivalCheckerName:            string | null;
    arrivalCheckerEmployeeNumber:  string | null;
  }[] = [];

  for (let i = 0; i < body.updates.length; i++) {
    const u = body.updates[i];
    const folio = (u?.folio || "").trim();
    if (!folio) continue;

    const arrivalDate = new Date(u.arrivalTime);
    if (Number.isNaN(arrivalDate.getTime())) continue;

    const odoFloat =
      typeof u.odometerArrival === "string"
        ? parseFloat(u.odometerArrival)
        : u.odometerArrival;

    if (odoFloat === null || odoFloat === undefined || Number.isNaN(odoFloat)) continue;
    if (odoFloat < 0) continue;

    normalized.push({
      folio,
      arrivalTime:              arrivalDate,
      odometerArrival:          odoFloat,
      arrivalLatitude:              u.latitude                     ?? null,
      arrivalLongitude:             u.longitude                    ?? null,
      arrivalLocationAccuracy:      u.locationAccuracy             ?? null,
      arrivalLocationTimestamp:     u.locationTimestamp ? new Date(u.locationTimestamp) : null,
      arrivalLocationStatus:        u.locationStatus               ?? null,
      arrivalLocationSource:        u.locationSource               ?? null,
      arrivalCheckerName:           u.arrivalCheckerName           ?? null,
      arrivalCheckerEmployeeNumber: u.arrivalCheckerEmployeeNumber ?? null,
    });
  }

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "No se proporcionaron actualizaciones válidas" },
      { status: 400 }
    );
  }

  try {
    const folios = Array.from(new Set(normalized.map((u) => u.folio)));

    const existing = await prisma.voucherCamion.findMany({
      where: { folio: { in: folios } },
      select: {
        folio:           true,
        arrivalTime:     true,
        odometerArrival: true,
        status:          true,
        frenteNombre:    true,
        voucherDatetime: true,
        cubicacion:      true,
        turno:           true,
      },
    });

    const existingMap = new Map(existing.map((e) => [e.folio, e]));

    const notFoundYet = folios.filter((folio) => !existingMap.has(folio));

    const repeat = normalized
      .filter((u) => existingMap.get(u.folio)?.status === VoucherCamionStatus.ARRIVED)
      .map((u) => u.folio);

    const repeatSet = new Set(repeat);

    const toUpdateFolios = normalized.filter(
      (u) => existingMap.has(u.folio) && !repeatSet.has(u.folio)
    );

    const toUpdateOps = toUpdateFolios.map((u) => {
      const current = existingMap.get(u.folio)!;
      return prisma.voucherCamion.update({
        where: { folio: u.folio },
        data: {
          arrivalTime:              current.arrivalTime     ?? u.arrivalTime,
          odometerArrival:          current.odometerArrival ?? u.odometerArrival,
          status:                   VoucherCamionStatus.ARRIVED,
          arrivalCreatedByUsername: decoded.username,
          arrivalLatitude:          u.arrivalLatitude,
          arrivalLongitude:         u.arrivalLongitude,
          arrivalLocationAccuracy:  u.arrivalLocationAccuracy,
          arrivalLocationTimestamp: u.arrivalLocationTimestamp,
          arrivalLocationStatus:        u.arrivalLocationStatus,
          arrivalLocationSource:        u.arrivalLocationSource,
          arrivalCheckerName:           u.arrivalCheckerName,
          arrivalCheckerEmployeeNumber: u.arrivalCheckerEmployeeNumber,
        },
      });
    });

    await prisma.$transaction(toUpdateOps);

    try {
      type DayKey = `${string}|${string}`;
      const byFrenteDate = new Map<DayKey, {
        frenteNombre: string;
        date: string;
        totalTrips: number;
        totalM3: number;
        turno1Arrived: number;
        turno2Arrived: number;
      }>();

      for (const u of toUpdateFolios) {
        const v = existingMap.get(u.folio)!;
        const cdmxDate = DateTime.fromJSDate(v.voucherDatetime)
          .setZone(CONFIG.TIMEZONE)
          .toISODate()!;
        const key: DayKey = `${v.frenteNombre}|${cdmxDate}`;
        const entry = byFrenteDate.get(key) ?? {
          frenteNombre: v.frenteNombre,
          date: cdmxDate,
          totalTrips: 0,
          totalM3: 0,
          turno1Arrived: 0,
          turno2Arrived: 0,
        };
        entry.totalTrips += 1;
        entry.totalM3 += v.cubicacion;
        entry.turno1Arrived += v.turno === 1 ? 1 : 0;
        entry.turno2Arrived += v.turno === 2 ? 1 : 0;
        byFrenteDate.set(key, entry);
      }

      await Promise.all(
        Array.from(byFrenteDate.values()).map((m) =>
          prisma.$executeRaw`
            INSERT INTO "DashboardDailyMetrics"
              ("frenteNombre", "date", "totalTrips", "totalM3", "turno1Arrived", "turno2Arrived", "updatedAt")
            VALUES
              (${m.frenteNombre}, ${m.date}, ${m.totalTrips}, ${m.totalM3}, ${m.turno1Arrived}, ${m.turno2Arrived}, NOW())
            ON CONFLICT ("frenteNombre", "date") DO UPDATE
            SET "totalTrips"    = "DashboardDailyMetrics"."totalTrips" + EXCLUDED."totalTrips",
                "totalM3"       = "DashboardDailyMetrics"."totalM3" + EXCLUDED."totalM3",
                "turno1Arrived" = "DashboardDailyMetrics"."turno1Arrived" + EXCLUDED."turno1Arrived",
                "turno2Arrived" = "DashboardDailyMetrics"."turno2Arrived" + EXCLUDED."turno2Arrived",
                "updatedAt"     = NOW()
          `
        )
      );

      const affectedFrentes = new Set(Array.from(byFrenteDate.values()).map((m) => m.frenteNombre));
      await Promise.all(Array.from(affectedFrentes).map((frente) => invalidateDashboardCache(frente)));
      await Promise.all(Array.from(affectedFrentes).map((frente) => invalidateTrucksFacetsCache(frente)));
    } catch (error) {
      console.error("❌ Error updating dashboard metrics:", error);
    }

    return NextResponse.json(
      {
        updated:     toUpdateFolios.map((u) => u.folio),
        notFoundYet,
        repeat,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Error de validación con los datos proporcionados" },
        { status: 400 }
      );
    }
    console.error("❌ Error batch arrival:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
