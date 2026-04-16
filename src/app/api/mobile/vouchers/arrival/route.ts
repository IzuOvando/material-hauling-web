import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import { VoucherCamionStatus } from "@/types/enum";

type ArrivalUpdateInput = {
  folio:                    string;
  arrivalTime:             string;
  odometerArrival:         number | string;
  latitude?:               number | null;
  longitude?:              number | null;
  locationAccuracy?:       number | null;
  locationTimestamp?:      string | null;
  locationStatus?:         string | null;
  locationSource?:         string | null;
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

  const invalid: { folio: string; error: string }[] = [];
  const normalized: {
    folio:                    string;
    arrivalTime:             Date;
    odometerArrival:         number;
    arrivalLatitude:         number | null;
    arrivalLongitude:        number | null;
    arrivalLocationAccuracy: number | null;
    arrivalLocationTimestamp: Date | null;
    arrivalLocationStatus:   string | null;
    arrivalLocationSource:   string | null;
  }[] = [];

  for (let i = 0; i < body.updates.length; i++) {
    const u = body.updates[i];
    const folio = (u?.folio || "").trim();

    if (!folio) {
      invalid.push({ folio: "(missing)", error: `folio requerido (index ${i})` });
      continue;
    }

    const arrivalDate = new Date(u.arrivalTime);
    if (Number.isNaN(arrivalDate.getTime())) {
      invalid.push({ folio, error: "arrivalTime inválido (usa ISO string)" });
      continue;
    }

    const odoFloat =
      typeof u.odometerArrival === "string"
        ? parseFloat(u.odometerArrival)
        : u.odometerArrival;

    if (odoFloat === null || odoFloat === undefined || Number.isNaN(odoFloat)) {
      invalid.push({ folio, error: "odometerArrival inválido" });
      continue;
    }
    if (odoFloat < 0) {
      invalid.push({ folio, error: "odometerArrival no puede ser negativo" });
      continue;
    }

    const arrivalLocationTimestamp = u.locationTimestamp
      ? new Date(u.locationTimestamp)
      : null;

    normalized.push({
      folio,
      arrivalTime:              arrivalDate,
      odometerArrival:          odoFloat,
      arrivalLatitude:          u.latitude          ?? null,
      arrivalLongitude:         u.longitude         ?? null,
      arrivalLocationAccuracy:  u.locationAccuracy  ?? null,
      arrivalLocationTimestamp: arrivalLocationTimestamp,
      arrivalLocationStatus:    u.locationStatus    ?? null,
      arrivalLocationSource:    u.locationSource    ?? null,
    });
  }

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "Todas las actualizaciones son inválidas", invalid },
      { status: 400 }
    );
  }

  try {
    const folios = Array.from(new Set(normalized.map((u) => u.folio)));

    const existing = await prisma.voucherCamion.findMany({
      where: { folio: { in: folios } },
      select: {
        folio:          true,
        arrivalTime:    true,
        odometerArrival: true,
        status:         true,
      },
    });

    const existingMap = new Map(existing.map((e) => [e.folio, e]));
    const notFoundYet = folios.filter((folio) => !existingMap.has(folio));

    const toUpdate = normalized
      .filter((u) => existingMap.has(u.folio))
      .map((u) => {
        const current = existingMap.get(u.folio)!;

        return prisma.voucherCamion.update({
          where: { folio: u.folio },
          data: {
            arrivalTime:     current.arrivalTime     ?? u.arrivalTime,
            odometerArrival: current.odometerArrival ?? u.odometerArrival,
            status:
              current.status === VoucherCamionStatus.ARRIVED
                ? current.status
                : VoucherCamionStatus.ARRIVED,

            arrivalLatitude:          u.arrivalLatitude,
            arrivalLongitude:         u.arrivalLongitude,
            arrivalLocationAccuracy:  u.arrivalLocationAccuracy,
            arrivalLocationTimestamp: u.arrivalLocationTimestamp,
            arrivalLocationStatus:    u.arrivalLocationStatus,
            arrivalLocationSource:    u.arrivalLocationSource,
          },
        });
      });

    await prisma.$transaction(toUpdate);

    return NextResponse.json(
      {
        updated: toUpdate.length
          ? normalized.filter((u) => existingMap.has(u.folio)).map((u) => u.folio)
          : [],
        notFoundYet,
        invalid,
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