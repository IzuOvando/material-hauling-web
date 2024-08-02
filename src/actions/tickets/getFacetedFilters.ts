import prisma from "@/lib/db";
import { FacetedFilter, TicketArea } from "@/types";
import { Acarreos, Gasolina } from "@prisma/client";
import { FILTER_FIELDS } from "./helpers";

// This function is expected to be called from other function that validates the frente and area parameters
export default async function getFacetedFilters(
  frente: string,
  area: TicketArea
) {
  // Query the groups
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
      });
    } else {
      return prisma.gasolina.findMany({
        distinct: [field as keyof Gasolina],
        where: {
          frenteNombre: frente,
        },
        select: {
          [field]: true,
        },
      });
    }
  });

  const groups = await Promise.all(groupsPromises);

  const facetedFilters: FacetedFilter[] = FILTER_FIELDS[area].map(
    (field, index) => ({
      field: field as keyof Acarreos | keyof Gasolina,
      options: groups[index].map((group) => group[field] as string),
    })
  );

  return facetedFilters;
}
