import { getAllTickets, getSomeTickets } from "@/actions/tickets";
import prisma from "@/lib/db";
import { TicketArea } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const filters = req.nextUrl.searchParams.get("filters") || undefined;
  const sort = req.nextUrl.searchParams.get("sort") || undefined;
  const { frente, area, allSelected } = body;

  try {
    // Validation Area
    if (
      ![TicketArea.ACARREOS, TicketArea.GASOLINA].includes(area as TicketArea)
    )
      return NextResponse.json({ error: "Invalid area" }, { status: 400 });

    if (!allSelected) {
      // Retrieve tickets by uuid
      const { selection } = body;
      const tickets = await getSomeTickets(selection, area, sort);
      return NextResponse.json(tickets);
    }

    // Retrieve all tickets also by filters
    const frenteOnDB = await prisma.frente.findUnique({
      where: { nombre: frente },
    });
    if (!frenteOnDB)
      return NextResponse.json({ error: "Frente not found" }, { status: 404 });

    const tickets = await getAllTickets(frente, area, filters, sort);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to get tickets", error);
    return NextResponse.json(
      { error: "Failed to get tickets" },
      { status: 500 }
    );
  }
}
