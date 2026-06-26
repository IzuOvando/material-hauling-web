import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { VoucherCamion as PrismaVoucherCamion } from "@prisma/client";
import { DateTime } from "luxon";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import {
  ValidationError,
  validateTurno,
} from "@/utils/validators";

import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";
import CONFIG from "@/config";


type RejectedVoucher = {
  folio: string;
  frenteNombre: string;
  reason: string;
};


async function resolveAllowedFrentes(
  role: string,
  username: string
): Promise<string[] | null> {
  if (role === "owner" || role === "general") return null;

  const userRecord = await prisma.user.findUnique({
    where: { username },
    include: { frentes: true },
  });

  return userRecord?.frentes.map((f) => f.frenteNombre) ?? [];
}

function partitionVouchers(
  vouchers: PrismaVoucherCamion[],
  allowedFrentes: string[] | null
): { allowed: PrismaVoucherCamion[]; rejected: RejectedVoucher[] } {
  if (allowedFrentes === null) {
    return { allowed: vouchers, rejected: [] };
  }

  const allowed: PrismaVoucherCamion[] = [];
  const rejected: RejectedVoucher[] = [];

  for (const voucher of vouchers) {
    if (allowedFrentes.includes(voucher.frenteNombre)) {
      allowed.push(voucher);
    } else {
      rejected.push({
        folio: voucher.folio,
        frenteNombre: voucher.frenteNombre,
        reason: "No tienes permiso para subir vouchers de este frente",
      });
    }
  }

  return { allowed, rejected };
}

function validateTurnos(vouchers: PrismaVoucherCamion[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const voucher of vouchers) {
    try {
      if (voucher.turno !== undefined) {
        validateTurno(voucher.turno);
      } else {
        errors.push(new ValidationError("turno", "El campo 'turno' es requerido"));
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        console.error("Error de validación inesperado:", error);
      }
    }
  }

  return errors;
}

function buildVoucherData(voucher: PrismaVoucherCamion, index: number, createdByUsername: string) {
  const odometerFloat =
    typeof voucher.odometer === "string"
      ? parseFloat(voucher.odometer)
      : voucher.odometer;

  if (Number.isNaN(odometerFloat)) {
    console.error(`❌ Odometer inválido en voucher [${index}]`, voucher.odometer);
    throw new Prisma.PrismaClientValidationError(
      `Odometer inválido: ${voucher.odometer}`,
      { clientVersion: "5.22.0" }
    );
  }

  const cubicacionFloat =
    typeof voucher.cubicacion === "string"
      ? parseFloat(voucher.cubicacion)
      : voucher.cubicacion;

  if (cubicacionFloat === undefined || cubicacionFloat === null || Number.isNaN(cubicacionFloat)) {
    console.error(`❌ Cubicación inválida en voucher [${index}]`, voucher.cubicacion);
    throw new Prisma.PrismaClientValidationError(
      `Cubicación inválida: ${voucher.cubicacion}`,
      { clientVersion: "5.22.0" }
    );
  }

  return {
    folio: voucher.folio,
    voucherDatetime: (voucher as any).voucherDatetime,
    destino: voucher.destino.trim(),
    origen: voucher.origen.trim(),
    material: voucher.material.trim(),
    placas: voucher.placas.trim(),
    odometer: odometerFloat,
    status: voucher.status ?? "IN_TRANSIT",
    operador: voucher.operador.trim(),
    turno: voucher.turno,
    localidad: voucher.localidad.trim(),
    noEconomico: voucher.noEconomico.trim(),
    empresa: voucher.empresa.trim(),
    cubicacion: cubicacionFloat,
    frenteNombre: voucher.frenteNombre,
    checkerName: voucher.checkerName.trim(),
    noEmpleado: voucher.noEmpleado.trim(),
    idCamion: voucher.idCamion.trim(),
    ...(voucher.checkerNo !== undefined &&
    voucher.checkerNo !== null &&
    voucher.checkerNo !== ""
      ? { checkerNo: voucher.checkerNo.trim() }
      : {}),
    latitude:          voucher.latitude          ?? null,
    longitude:         voucher.longitude         ?? null,
    locationAccuracy:  voucher.locationAccuracy  ?? null,
    locationTimestamp: voucher.locationTimestamp
      ? new Date(voucher.locationTimestamp)
      : null,
    locationStatus:    voucher.locationStatus    ?? null,
    locationSource:    voucher.locationSource    ?? null,
    createdByUsername,
  };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
    return NextResponse.json(
      { error: "No autorizado, proporcione credenciales válidas para realizar esta acción" },
      { status: 401 }
    );
  }

  const decoded = TokenAuthenticator.decode(accessToken);
  if (!decoded) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  let vouchersArray: PrismaVoucherCamion[] = [];

  try {
    const requestBody = await req.json();
    vouchersArray = Object.values(requestBody) as PrismaVoucherCamion[];
  } catch {
    return NextResponse.json(
      { error: "Formato JSON inválido" },
      { status: 400 }
    );
  }

  if (!vouchersArray || vouchersArray.length === 0) {
    return NextResponse.json(
      { error: "No se proporcionaron datos de vouchers" },
      { status: 400 }
    );
  }

  for (const [i, v] of vouchersArray.entries()) {
    if (!v?.folio || typeof v.folio !== "string" || !v.folio.trim()) {
      return NextResponse.json(
        { error: `Voucher [${i}] no trae folio válido` },
        { status: 400 }
      );
    }
  }

  let allowedFrentes: string[] | null;

  try {
    allowedFrentes = await resolveAllowedFrentes(decoded.role, decoded.username);
  } catch (err) {
    console.error("❌ Error resolviendo frentes del usuario:", err);
    return NextResponse.json(
      { error: "Error interno al verificar permisos" },
      { status: 500 }
    );
  }

  const { allowed, rejected } = partitionVouchers(vouchersArray, allowedFrentes);

  if (allowed.length === 0) {
    return NextResponse.json(
      {
        error: "Ningún voucher pertenece a tus frentes asignados.",
        updated: [],
        rejected,
      },
      { status: 403 }
    );
  }

  vouchersArray = allowed;

  const turnoErrors = validateTurnos(vouchersArray);
  if (turnoErrors.length > 0) {
    return NextResponse.json(
      { errors: turnoErrors.map((e) => ({ field: e.field, message: e.message })) },
      { status: 400 }
    );
  }

  try {
    const uniqueFrentes = [...new Set(vouchersArray.map((v) => v.frenteNombre))];

  } catch (error) {
    console.error("❌ Error invalidando caché:", error);
    return NextResponse.json(
      { error: "Error interno al invalidar caché" },
      { status: 500 }
    );
  }

  try {
    for (const voucher of vouchersArray) {
      const rawTime = String((voucher as any).voucherTime ?? (voucher as any).voucherDatetime);
      const parsed = new Date(rawTime);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Error en el formato de fecha/hora proporcionado" },
          { status: 400 }
        );
      }
      (voucher as any).voucherDatetime = parsed;
    }
  } catch {
    return NextResponse.json(
      { error: "Error interno procesando fechas" },
      { status: 500 }
    );
  }

  const existingFolioSet = new Set(
    (
      await prisma.voucherCamion.findMany({
        where: { folio: { in: vouchersArray.map((v) => v.folio) } },
        select: { folio: true },
      })
    ).map((v) => v.folio)
  );

  try {
    await prisma.$transaction(
      vouchersArray.map((voucher, index) => {
        const { frenteNombre, ...restData } = buildVoucherData(voucher, index, decoded.username);
        return prisma.voucherCamion.upsert({
          where: { folio: voucher.folio },
          create: {
            ...restData,
            frente: { connect: { nombre: frenteNombre } },
          },
          update: {},
        });
      })
    );
  } catch (error) {
    console.error("❌ Error en transacción Prisma:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Uno o más frentes indicados no existen" },
          { status: 400 }
        );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Error de validación con los datos proporcionados" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }

  try {
    const newVouchers = vouchersArray.filter((v) => !existingFolioSet.has(v.folio));

    type DayKey = `${string}|${string}`;
    const byFrenteDate = new Map<DayKey, { frenteNombre: string; date: string; count: number }>();

    for (const v of newVouchers) {
      const cdmxDate = DateTime.fromJSDate((v as any).voucherDatetime as Date)
        .setZone(CONFIG.TIMEZONE)
        .toISODate()!;
      const key: DayKey = `${v.frenteNombre}|${cdmxDate}`;
      const entry = byFrenteDate.get(key) ?? { frenteNombre: v.frenteNombre, date: cdmxDate, count: 0 };
      entry.count += 1;
      byFrenteDate.set(key, entry);
    }

    await Promise.all(
      Array.from(byFrenteDate.values()).map((m) =>
        prisma.$executeRaw`
          INSERT INTO "DashboardDailyMetrics"
            ("frenteNombre", "date", "totalVouchers", "totalTrips", "totalM3", "turno1Arrived", "turno2Arrived", "updatedAt")
          VALUES
            (${m.frenteNombre}, ${m.date}, ${m.count}, 0, 0, 0, 0, NOW())
          ON CONFLICT ("frenteNombre", "date") DO UPDATE
          SET "totalVouchers" = "DashboardDailyMetrics"."totalVouchers" + EXCLUDED."totalVouchers",
              "updatedAt"     = NOW()
        `
      )
    );

    const affectedFrentes = new Set(newVouchers.map((v) => v.frenteNombre));
    await Promise.all(Array.from(affectedFrentes).map((frente) => invalidateDashboardCache(frente)));
    await Promise.all(Array.from(affectedFrentes).map((frente) => invalidateTrucksFacetsCache(frente)));
  } catch (error) {
    console.error("❌ Error updating dashboard metrics:", error);
  }

  return NextResponse.json(
    {
      message: "Vouchers procesados con éxito",
      updated: vouchersArray.map((v) => v.folio),
      rejected,
    },
    { status: 201 }
  );
}