import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const MAX_ENTRIES = 100;

interface CloseEntry {
  folio: string;
  odometerArrival?: number | null;
  arrivalTime?: string | null;
}

interface CloseResult {
  closed: string[];
  failed: Array<{ folio: string; reason: string }>;
}

async function closeOne(entry: CloseEntry): Promise<{ folio: string; ok: true } | { folio: string; ok: false; reason: string }> {
  const arrivalTime = entry.arrivalTime ? new Date(entry.arrivalTime) : null;

  if (arrivalTime !== null && isNaN(arrivalTime.getTime())) {
    return { folio: entry.folio, ok: false, reason: "Fecha de llegada inválida." };
  }

  try {
    await prisma.voucherCamion.update({
      where: {
        folio: entry.folio,
        status: "IN_TRANSIT",
      },
      data: {
        status: "ARRIVED",
        odometerArrival: entry.odometerArrival ?? null,
        arrivalTime: arrivalTime,
      },
    });
    return { folio: entry.folio, ok: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        folio: entry.folio,
        ok: false,
        reason: "No encontrado o ya cerrado.",
      };
    }
    return { folio: entry.folio, ok: false, reason: "Error interno al actualizar." };
  }
}

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { entries } = body as { entries?: unknown };

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "Se requiere un arreglo de entries." },
      { status: 400 }
    );
  }

  if (entries.length > MAX_ENTRIES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ENTRIES} ciclos por operación.` },
      { status: 400 }
    );
  }

  for (const entry of entries) {
    if (typeof (entry as CloseEntry).folio !== "string") {
      return NextResponse.json(
        { error: "Cada entry debe tener un folio string." },
        { status: 400 }
      );
    }
  }

  const results = await Promise.allSettled(
    (entries as CloseEntry[]).map(closeOne)
  );

  const response: CloseResult = { closed: [], failed: [] };

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.ok) {
        response.closed.push(result.value.folio);
      } else {
        response.failed.push({
          folio: result.value.folio,
          reason: result.value.reason,
        });
      }
    } else {
      response.failed.push({
        folio: "desconocido",
        reason: "Error inesperado.",
      });
    }
  }

  logSecurityEvent({
    type: SecurityEventType.DATA_UPDATE,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    resource: "/api/trucks/closeCycles",
    details: {
      user: user.name,
      closed: response.closed.length,
      failed: response.failed.length,
    },
  });

  return NextResponse.json(response);
}
