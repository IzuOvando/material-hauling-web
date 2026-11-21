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

    const deleted = await prisma.$transaction(async (tx) => {
      const removed = await tx.$queryRaw<MetricsVoucher[]>`
        DELETE FROM "VoucherCamion" WHERE "frenteNombre" = ${frenteNombre}
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
      details: { frenteNombre, count: deleted.length },
    });

    return NextResponse.json({
      message: `Se eliminaron ${deleted.length} registros para el frente ${frenteNombre}.`,
    });
  } catch (error) {
    console.error("Error al eliminar los registros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
