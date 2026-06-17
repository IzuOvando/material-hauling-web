import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  getTrucksFacets,
  getTrucksFacetsFromCache,
  setTrucksFacetsInCache,
} from "@/actions/trucks";
import { getAppUser } from "@/auth/auth.user";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const frente = params.get("frente");
  const filters = params.get("filters") || undefined;

  if (!frente) {
    return NextResponse.json(
      { error: "Required param frente" },
      { status: 400 }
    );
  }

  const user = await getAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPrivileged = user.role === "owner" || user.role === "general";
  if (!isPrivileged && !user.frentes.includes(frente)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const frenteOnDB = await prisma.frente.findUnique({ where: { nombre: frente } });
  if (!frenteOnDB) {
    return NextResponse.json({ error: "Frente not found" }, { status: 404 });
  }

  const cached = await getTrucksFacetsFromCache(frente, filters);
  if (cached) {
    return NextResponse.json({ facets: cached });
  }

  try {
    const facets = await getTrucksFacets(frente, filters);
    await setTrucksFacetsInCache(frente, filters, facets);
    return NextResponse.json({ facets });
  } catch (error) {
    console.error("Failed to get trucks facets", error);
    return NextResponse.json(
      { error: "Failed to get facets" },
      { status: 500 }
    );
  }
}
