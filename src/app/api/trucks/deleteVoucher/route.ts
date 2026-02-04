import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

export async function POST(req: NextRequest) {
  try {
    const { frenteNombre } = await req.json();

    if (!frenteNombre) {
      return NextResponse.json(
        { error: "El nombre del frente es obligatorio." },
        { status: 400 }
      );
    }

    const deleted = await prisma.voucherCamion.deleteMany({
      where: { frenteNombre },
    });

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
