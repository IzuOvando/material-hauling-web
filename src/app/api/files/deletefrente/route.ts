import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import blobClient from "@/lib/blobClient";
import { invalidateFacetsCache } from "@/actions/tickets";
import { TicketArea } from "@/types";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";

export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();

    const frente = await prisma.frente.findUnique({
      where: { nombre },
      select: {
        excelUrlGasolinaBlob: true,
        excelUrlAcarreosBlob: true,
      },
    });

    if (!frente) {
      return NextResponse.json(
        { error: "Frente no encontrado." },
        { status: 404 }
      );
    }

    if (frente.excelUrlAcarreosBlob) {
      await blobClient.deleteBlob(frente.excelUrlAcarreosBlob);
    }
    if (frente.excelUrlGasolinaBlob) {
      await blobClient.deleteBlob(frente.excelUrlGasolinaBlob);
    }
    await prisma.frente.delete({
      where: { nombre },
    });

    await invalidateFacetsCache(nombre, TicketArea.ACARREOS);
    await invalidateFacetsCache(nombre, TicketArea.GASOLINA);

    logSecurityEvent({
      type: SecurityEventType.DATA_DELETE,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      resource: "/api/files/deletefrente",
      details: { frenteNombre: nombre },
    });

    return NextResponse.json(
      {
        message: `Frente ${nombre} y todos los tickets relacionados han sido eliminados.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar el frente:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el frente." },
      { status: 500 }
    );
  }
}
