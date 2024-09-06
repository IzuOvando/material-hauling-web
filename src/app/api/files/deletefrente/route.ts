import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import blobClient from "@/lib/blobClient";
import { invalidateFacetsCache } from "@/actions/tickets";
import { TicketArea } from "@/types";

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
