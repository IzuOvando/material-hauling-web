import prisma from "@/lib/db";
import { kv } from "@vercel/kv";
import { MD5 as md5 } from "crypto-js";
import type { TrucksFacets } from "@/types/trucks-filters";
import { getTrucksFilters } from "./filters";

const FACET_FIELDS = [
  "material",
  "checkerName",
  "arrivalCheckerName",
] as const;

type FacetField = (typeof FACET_FIELDS)[number];

export async function getTrucksFacets(
  frente: string,
  filters: string | undefined
): Promise<TrucksFacets> {
  const extra = getTrucksFilters(filters);

  const facets: TrucksFacets = {
    material: [],
    checkerName: [],
    arrivalCheckerName: [],
    frenteNombre: [],
  };

  await Promise.all(
    FACET_FIELDS.map(async (field) => {
      const where: any = { frenteNombre: frente };
      if (extra) {
        const scoped = { ...extra } as any;
        delete scoped[field];
        where.AND = scoped;
      }
      const groups = await prisma.voucherCamion.groupBy({
        by: [field as any],
        where,
        _count: { [field]: true } as any,
        orderBy: { [field]: "asc" } as any,
      });
      facets[field] = groups
        .map((g: any) => ({
          value: String(g[field] ?? ""),
          count: g._count?.[field] ?? 0,
        }))
        .filter((opt) => opt.value !== "");
    })
  );

  return facets;
}

export async function getTrucksFrentesFacet(
  allowedFrentes: string[]
): Promise<{ value: string; count: number }[]> {
  if (allowedFrentes.length === 0) return [];
  const groups = await prisma.voucherCamion.groupBy({
    by: ["frenteNombre"],
    where: { frenteNombre: { in: allowedFrentes } },
    _count: { frenteNombre: true },
    orderBy: { frenteNombre: "asc" },
  });
  return groups.map((g) => ({
    value: g.frenteNombre,
    count: g._count.frenteNombre,
  }));
}

const CACHE_TTL_SECONDS = 21600; // 6 hours

const cacheKey = (frente: string, filters: string | undefined) =>
  `trucks_facets_${frente}_${filters ? md5(filters).toString() : "none"}`;

export async function getTrucksFacetsFromCache(
  frente: string,
  filters: string | undefined
): Promise<TrucksFacets | null> {
  try {
    return (await kv.get(cacheKey(frente, filters))) as TrucksFacets | null;
  } catch (error: any) {
    console.error("trucks_facets cache get failed", error?.message);
    return null;
  }
}

export async function setTrucksFacetsInCache(
  frente: string,
  filters: string | undefined,
  facets: TrucksFacets
): Promise<void> {
  try {
    await kv.set(cacheKey(frente, filters), facets, { ex: CACHE_TTL_SECONDS });
  } catch (error: any) {
    console.error("trucks_facets cache set failed", error?.message);
  }
}

export async function invalidateTrucksFacetsCache(frente: string): Promise<void> {
  try {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await kv.scan(cursor, {
        match: `trucks_facets_${frente}_*`,
        count: 1000,
      });
      for (const key of keys) {
        await kv.del(key);
      }
      cursor = Number(nextCursor);
    } while (cursor !== 0);
  } catch (error: any) {
    console.error("trucks_facets cache invalidate failed", error?.message);
  }
}
