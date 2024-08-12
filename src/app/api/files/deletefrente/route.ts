import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import blobClient from "@/lib/blobClient";


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
