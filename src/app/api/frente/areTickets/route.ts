import { NextRequest, NextResponse } from "next/server";
import { TicketArea } from "@/types";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();

    const frente = await prisma.frente.findUnique({
      where: { nombre },
      select: {
        excelUrlGasolinaBlob: true,
        excelUrlAcarreosBlob: true,
        excelUrlConcretoBlob: true,
        excelUrlAsfaltoBlob: true,
      },
    });

    if (!frente) {
      return NextResponse.json(
        { error: "Frente no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      [TicketArea.ACARREOS]: frente.excelUrlAcarreosBlob
        ? frente.excelUrlAcarreosBlob.length > 0
        : false,
      [TicketArea.GASOLINA]: frente.excelUrlGasolinaBlob
        ? frente.excelUrlGasolinaBlob.length > 0
        : false,
      [TicketArea.ASFALTO]: frente.excelUrlAsfaltoBlob
        ? frente.excelUrlAsfaltoBlob.length > 0
        : false,
      [TicketArea.CONCRETO]: frente.excelUrlConcretoBlob
        ? frente.excelUrlConcretoBlob.length > 0
        : false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read tickets on Frente" },
      { status: 500 }
    );
  }
}
