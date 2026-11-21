import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";
import {
  METRICS_RETURNING,
  METRICS_TRANSACTION_OPTIONS,
  applyVoucherMetrics,
  refreshVoucherCaches,
  type MetricsVoucher,
} from "@/lib/dashboardMetrics";
import { getTrucksFilters } from "@/actions/trucks/filters";

class CountMismatchError extends Error {
  constructor(readonly actual: number) {
    super("count_mismatch");
  }
}

/**
 * Deletes the vouchers of a frente that match `filters` (the same string the DB
 * view uses), and nothing else. `expectedCount` is what the user saw in the
 * confirmation; if the data changed since, nothing is deleted (409).
 */
export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Sin autorización." }, { status: 403 });
  }

  try {
    const { frenteNombre, filters, expectedCount } = await req.json();

    if (!frenteNombre) {
      return NextResponse.json(
        { error: "El nombre del frente es obligatorio." },
        { status: 400 }
      );
    }
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      return NextResponse.json(
        { error: "Falta la cantidad de registros a eliminar." },
        { status: 400 }
      );
    }

    const extra = getTrucksFilters(filters);
    const where = { frenteNombre, ...(extra ? { AND: extra } : {}) };

    const deleted = await prisma.$transaction(async (tx) => {
      const matched = await tx.voucherCamion.findMany({ where, select: { folio: true } });
      if (matched.length !== expectedCount) throw new CountMismatchError(matched.length);

      const folios = matched.map((v) => v.folio);
      const removed = await tx.$queryRaw<MetricsVoucher[]>`
        DELETE FROM "VoucherCamion"
        WHERE "frenteNombre" = ${frenteNombre} AND "folio" = ANY(${folios})
        RETURNING ${METRICS_RETURNING}
      `;
      await applyVoucherMetrics(tx, "removed", removed);
      return removed;
    }, METRICS_TRANSACTION_OPTIONS);

    await refreshVoucherCaches(deleted);

    logSecurityEvent({
      type: SecurityEventType.DATA_DELETE,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      resource: "/api/trucks/deleteVoucher",
      details: { frenteNombre, count: deleted.length, filters: filters || null },
    });

    return NextResponse.json({
      message: `Se eliminaron ${deleted.length} registros para el frente ${frenteNombre}.`,
      deleted: deleted.length,
    });
  } catch (error) {
    if (error instanceof CountMismatchError) {
      return NextResponse.json(
        {
          error: "Los registros cambiaron desde que abriste esta ventana. No se eliminó nada; recarga la página e inténtalo de nuevo.",
          actualCount: error.actual,
        },
        { status: 409 }
      );
    }
    console.error("Error al eliminar los registros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
