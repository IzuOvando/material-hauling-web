import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();

    const frente = await prisma.frente.findUnique({
      where: { nombre },
      include: { tickets: true },
    });

    if (!frente) {
      return NextResponse.json(
        { error: "Frente no encontrado." },
        { status: 404 }
      );
    }

    const areTickets = frente.tickets.length > 0;

    return NextResponse.json({
      areTickets: areTickets,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read tickets on Frente" },
      { status: 500 }
    );
  }
}
