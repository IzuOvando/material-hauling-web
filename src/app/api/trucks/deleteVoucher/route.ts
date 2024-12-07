import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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
