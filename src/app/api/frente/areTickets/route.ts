import { NextRequest, NextResponse } from "next/server";
import { TicketArea } from "@/types";
import prisma from "@/lib/db";

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

    return NextResponse.json({
      [TicketArea.ACARREOS]: frente.ticketsAcarreos.length > 0,
      [TicketArea.GASOLINA]: frente.ticketsGasolina.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read tickets on Frente" },
      { status: 500 }
    );
  }
}
