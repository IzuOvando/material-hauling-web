import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  METRICS_SELECT,
  METRICS_TRANSACTION_OPTIONS,
  applyVoucherMetrics,
  refreshVoucherCaches,
  type MetricsVoucher,
} from "@/lib/dashboardMetrics";
import { VoucherCamionStatus } from "@/types/enum";

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

type CloseOutcome =
  | { folio: string; ok: true; voucher: MetricsVoucher }
  | { folio: string; ok: false; reason: string };

/** Closes one IN_TRANSIT voucher; the row it returns is what gets added to the metrics. */
async function closeOne(
  tx: Pick<typeof prisma, "voucherCamion">,
  entry: CloseEntry
): Promise<CloseOutcome> {
  const arrivalTime = entry.arrivalTime ? new Date(entry.arrivalTime) : null;

  if (arrivalTime !== null && isNaN(arrivalTime.getTime())) {
    return { folio: entry.folio, ok: false, reason: "Fecha de llegada inválida." };
  }

  try {
    const voucher = await tx.voucherCamion.update({
      where: {
        folio: entry.folio,
        status: VoucherCamionStatus.IN_TRANSIT,
      },
      data: {
        status: VoucherCamionStatus.ARRIVED,
        odometerArrival: entry.odometerArrival ?? null,
        arrivalTime: arrivalTime,
      },
      select: METRICS_SELECT,
    });
    return { folio: entry.folio, ok: true, voucher };
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
    throw error;
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

  let outcomes: CloseOutcome[];
  try {
    outcomes = await prisma.$transaction(async (tx) => {
      const results: CloseOutcome[] = [];
      for (const entry of entries as CloseEntry[]) {
        results.push(await closeOne(tx, entry));
      }
      const closed = results.flatMap((r) => (r.ok ? [r.voucher] : []));
      await applyVoucherMetrics(tx, "arrived", closed);
      return results;
    }, METRICS_TRANSACTION_OPTIONS);
  } catch (error) {
    console.error("Error al cerrar ciclos:", error);
    return NextResponse.json(
      { error: "Error interno al cerrar ciclos. No se cerró ninguno." },
      { status: 500 }
    );
  }

  const closedVouchers = outcomes.flatMap((r) => (r.ok ? [r.voucher] : []));
  await refreshVoucherCaches(closedVouchers);

  const response: CloseResult = {
    closed: outcomes.flatMap((r) => (r.ok ? [r.folio] : [])),
    failed: outcomes.flatMap((r) => (r.ok ? [] : [{ folio: r.folio, reason: r.reason }])),
  };

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
