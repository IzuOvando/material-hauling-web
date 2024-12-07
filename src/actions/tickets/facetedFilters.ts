import prisma from "@/lib/db";
import { FacetedFilter, TicketArea, Section } from "@/types";
import { Acarreos, Gasolina, Concreto, VoucherCamion } from "@prisma/client";
import { FILTER_FIELDS, getFilters } from "./helpers";
import { kv } from "@vercel/kv";

type CountsType = {
  [key: string]: number;
};

type DistinctValuesType = {
  [key: string]: any;
};

// * DATABASE QUERIES *

// This function is expected to be called from other function that validates the frente and area parameters
export default async function getFacetedFilters(
  frente: string,
  area: TicketArea | Section,
  filters?: string
) {
  const distinctValues = await getDistinctValues(frente, area);
  const counters = await getCounts(frente, area, filters);

  const facetedFilters: FacetedFilter[] = FILTER_FIELDS[area].map(
    (field, index) => ({
      field: field as
        | keyof Acarreos
        | keyof Gasolina
        | keyof Concreto
        | keyof VoucherCamion,
      options: distinctValues[index].map((distinct: DistinctValuesType) => {
        const value = distinct[field];
        return {
          value: value,
          count: counters[value] || 0,
        };
      }),
    })
  );

  return facetedFilters;
}

const getDistinctValues = async (
  frente: string,
  area: TicketArea | Section
): Promise<DistinctValuesType[]> => {
  // Get values from cache
  const cacheKey = `facets_${frente}_${area}_distinct`;
  const cachedDistinctValues = await getDistinctValuesFromCache(cacheKey);
  if (cachedDistinctValues) return cachedDistinctValues;

  // Get distinct values from database and cache them
  const groupsPromises = FILTER_FIELDS[area].map((field) => {
    if (area === TicketArea.ACARREOS) {
      return prisma.acarreos.findMany({
        distinct: [field as keyof Acarreos],
        where: {
          frenteNombre: frente,
        },
        select: {
          [field]: true,
        },
        orderBy: {
          [field]: "asc",
        },
      });
    } else if (area === TicketArea.GASOLINA) {
      return prisma.gasolina.findMany({
        distinct: [field as keyof Gasolina],
        where: {
          frenteNombre: frente,
        },
        select: {
          [field]: true,
        },
        orderBy: {
          [field]: "asc",
        },
      });
    } else if (area === TicketArea.CONCRETO) {
      return prisma.concreto.findMany({
        distinct: [field as keyof Concreto],
        where: {
          frenteNombre: frente,
        },
        select: {
          [field]: true,
        },
        orderBy: {
          [field]: "asc",
        },
      });
    } else {
      return prisma.voucherCamion.findMany({
        distinct: [field as keyof VoucherCamion],
        where: {
          frenteNombre: frente,
        },
        select: {
          [field]: true,
        },
        orderBy: {
          [field]: "asc",
        },
      });
    }
  });

  let distinctValues: any = await Promise.all(groupsPromises);

  // Parse dates if needed
  distinctValues = distinctValues.map((group: any) => {
    if (Object.hasOwn(group[0], "fecha"))
      return group.map((item: any) => ({
        fecha: item.fecha.toISOString(),
      }));
    else if (Object.hasOwn(group[0], "voucherDate")) {
      return group.map((item: any) => ({
        voucherDate: item.voucherDate.toISOString(),
      }));
    } else return group;
  });

  await setDistinctValuesInCache(cacheKey, distinctValues);

  return distinctValues;
};

const getCounts = async (
  frente: string,
  area: TicketArea | Section,
  filters?: string
) => {
  let where: any = {
    frenteNombre: frente,
  };

  // Add filters on where
  if (filters) {
    const filtersOnWhere = getFilters(filters, area);
    if (filtersOnWhere) where = { ...where, AND: filtersOnWhere };
  }

  // Querying counts
  const groupsPromises = FILTER_FIELDS[area].map((field) => {
    const localWhere = JSON.parse(JSON.stringify(where));
    if (where.AND && where.AND[field]) delete localWhere.AND[field];
    if (area === TicketArea.ACARREOS) {
      return prisma.acarreos.groupBy({
        by: [field as keyof Acarreos],
        where: localWhere,
        _count: {
          [field]: true,
        },
      });
    } else if (area === TicketArea.GASOLINA) {
      return prisma.gasolina.groupBy({
        by: [field as keyof Gasolina],
        where: localWhere,
        _count: {
          [field]: true,
        },
      });
    } else if (area === TicketArea.CONCRETO) {
      return prisma.concreto.groupBy({
        by: [field as keyof Concreto],
        where: localWhere,
        _count: {
          [field]: true,
        },
      });
    } else {
      return prisma.voucherCamion.groupBy({
        by: [field as keyof VoucherCamion],
        where: localWhere,
        _count: {
          [field]: true,
        },
      });
    }
  });

  let groups: any = await Promise.all(groupsPromises);

  // Parse dates if needed
  groups = groups.map((group: any) => {
    if (Object.hasOwn(group[0], "fecha"))
      return group.map((item: any) => ({
        ...item,
        fecha: item.fecha.toISOString(),
      }));
    else if (Object.hasOwn(group[0], "voucherDate"))
      return group.map((item: any) => ({
        ...item,
        voucherDate: item.voucherDate.toISOString(),
      }));
    else return group;
  });

  // Changing schema
  const counts: CountsType = groups.reduce((acc: CountsType, group: any) => {
    group.forEach((item: any) => {
      const key = Object.keys(item).find((k) => k !== "_count");

      if (key !== undefined) {
        const value = item[key];
        const count = item._count[key];

        acc[value as string] = count;
      }
    });
    return acc;
  }, {});

  return counts;
};

// * CACHE QUERIES *

export const getFacetedFiltersFromCache = async (
  cacheKey: string
): Promise<FacetedFilter[] | null> => {
  try {
    const cachedFacets = await kv.get(cacheKey);
    return cachedFacets ? (cachedFacets as FacetedFilter[]) : null;
  } catch (error: any) {
    console.error("Failed to retrieve facets from cache", error?.message);
    return null;
  }
};

export const setFacetedFiltersInCache = async (
  cacheKey: string,
  facets: FacetedFilter[]
) => {
  try {
    await kv.set(cacheKey, facets, { ex: 21600 }); // Cache for 6 hours
  } catch (error: any) {
    console.error("Failed to set facets to cache", error?.message);
  }
};

const getDistinctValuesFromCache = async (
  cacheKey: string
): Promise<DistinctValuesType[] | null> => {
  try {
    const distinctValues = await kv.get(cacheKey);
    return distinctValues ? (distinctValues as DistinctValuesType[]) : null;
  } catch (error: any) {
    console.error(
      "Failed to retrieve distinct values from cache",
      error?.message
    );
    return null;
  }
};

export const setDistinctValuesInCache = async (
  cacheKey: string,
  distincValues: DistinctValuesType[]
) => {
  try {
    await kv.set(cacheKey, distincValues, { ex: 604800 }); // Cache for 7 days
  } catch (error: any) {
    console.error("Failed to set distinct values into cache", error?.message);
  }
};

export const invalidateFacetsCache = async (
  frente: string,
  area: TicketArea | Section
) => {
  try {
    const [cursor, keys] = await kv.scan(0, {
      match: `facets_${frente}_${area}*`,
      count: 1000,
    });

    keys.forEach(async (key) => {
      await kv.del(key);
    });
  } catch (error: any) {
    console.error("Failed to invalidate facets cache", error?.message);
  }
};
