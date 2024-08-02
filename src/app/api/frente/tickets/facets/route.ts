import { getFacetedFilters } from "@/actions/tickets";
import prisma from "@/lib/db";
import { TicketArea } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const frente = params.get("frente");
  const area = params.get("area");
  const filters = params.get("filters") || undefined;

  // Validations
  if (!frente || !area)
    return NextResponse.json(
      { error: "Required params frente and area" },
      { status: 400 }
    );
  if (![TicketArea.ACARREOS, TicketArea.GASOLINA].includes(area as TicketArea))
    return NextResponse.json({ error: "Invalid area" }, { status: 400 });
  const frenteOnDB = await prisma.frente.findUnique({
    where: { nombre: frente },
  });
  if (!frenteOnDB)
    return NextResponse.json({ error: "Frente not found" }, { status: 404 });

  try {
    const facets = await getFacetedFilters(frente, area as TicketArea);
    return NextResponse.json({ facets });
  } catch (error) {
    console.error("Failed to get facets", error);
    return NextResponse.json(
      { error: "Failed to get facets" },
      { status: 500 }
    );
  }
}
