import {
  getFacetedFilters,
  getFacetedFiltersFromCache,
  setFacetedFiltersInCache,
} from "@/actions/tickets";
import prisma from "@/lib/db";
import { TicketArea } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { MD5 as md5 } from "crypto-js";

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
    select: { excelUrlGasolinaBlob: true, excelUrlAcarreosBlob: true },
  });
  if (!frenteOnDB)
    return NextResponse.json({ error: "Frente not found" }, { status: 404 });
  // If is empty just return empty array
  if (
    (area === TicketArea.ACARREOS && !frenteOnDB.excelUrlAcarreosBlob) ||
    (area === TicketArea.GASOLINA && !frenteOnDB.excelUrlGasolinaBlob)
  )
    return NextResponse.json({ facets: [] });

  // Preparing cache key
  const cacheKey = `facets_${frente}_${area}${getPartialKeyFilters(filters)}`;

  // Requesting facets from cache
  const cachedFacets = await getFacetedFiltersFromCache(cacheKey);
  if (cachedFacets) return NextResponse.json({ facets: cachedFacets });

  // Requesting facets from database and caching them
  try {
    const facets = await getFacetedFilters(frente, area as TicketArea, filters);
    if (facets.length > 0) await setFacetedFiltersInCache(cacheKey, facets);
    return NextResponse.json({ facets });
  } catch (error) {
    console.error("Failed to get facets", error);
    return NextResponse.json(
      { error: "Failed to get facets" },
      { status: 500 }
    );
  }
}

const getPartialKeyFilters = (filters?: string) => {
  if (!filters) return "";
  return `_${md5(filters).toString()}`;
};
