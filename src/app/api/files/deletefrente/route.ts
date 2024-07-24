import prisma from "@/lib/db";
import * as path from "path";
import { NextRequest, NextResponse } from "next/server";
import { deleteFilesInDirectory } from "@/helpers/deletefilesdirectory";


export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();

    const frente = await prisma.frente.findUnique({
      where: { nombre },
      include: { ticketsAcarreos: true, ticketsGasolina: true },
    });

    if (!frente) {
      return NextResponse.json(
        { error: "Frente no encontrado." },
        { status: 404 }
      );
    }

    await prisma.frente.delete({
      where: { nombre },
    });

    const rootPath = path.resolve(process.cwd());
    const specificFilePath = path.join(rootPath, "db_output", "excel", nombre);
    await deleteFilesInDirectory(specificFilePath);

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
