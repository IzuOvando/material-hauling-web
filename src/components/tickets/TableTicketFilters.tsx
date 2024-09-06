"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableTicketFacetedFilter } from "./TableTicketFacetedFilter";
import { FacetedFilter, TicketArea } from "@/types";
import { FILTER_FIELDS } from "@/actions/tickets/helpers";
import { useTableTicketsGlobal } from "@/contexts";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface TableTicketFiltersProps {
  frente: string;
  area: TicketArea;
}

export function TableTicketFilters({ frente, area }: TableTicketFiltersProps) {
  const [facets, setFacets] = useState<FacetedFilter[]>(
    FILTER_FIELDS[area].map((field) => ({
      field: field as any,
      options: [],
    }))
  );
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set());
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterParams, setFilterParams] = useState<string | null>(null);
  const facetsRefs = useRef<any[]>([]);
  const facetsRequestCancelaToken = useRef(axios.CancelToken.source());

  const activeParams = useSearchParams();
  const { updateFilters, cleanFilters } = useTableTicketsGlobal();

  const handleCleanFilters = () => {
    setActiveFields(new Set());
    facetsRefs.current.forEach((ref) => {
      if (ref) ref.cleanSelections();
    });
    cleanFilters();
  };

  const handleFilters = useCallback((field: string, activeFacets: string[]) => {
    if (activeFacets.length === 0) {
      setActiveFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    } else {
      setActiveFields((prev) => new Set(prev).add(field));
    }

    updateFilters(field, activeFacets, area);
  }, []);

  useEffect(() => {
    const newFiltersParams = activeParams.get("filters");
    if (newFiltersParams !== filterParams) setFilterParams(newFiltersParams);
  }, [activeParams]);

  useEffect(() => {
    const getFacets = () => {
      if (facetsRequestCancelaToken.current)
        facetsRequestCancelaToken.current.cancel();

      facetsRequestCancelaToken.current = axios.CancelToken.source();

      const params = new URLSearchParams();
      params.set("frente", frente);
      params.set("area", area);
      if (filterParams) params.set("filters", filterParams);
      axios
        .get(`/api/frente/tickets/facets?${params.toString()}`, {
          cancelToken: facetsRequestCancelaToken.current.token,
        })
        .then((res: any) => {
          setFacets(res.data.facets);
        })
        .catch((error) => {
          if (axios.isCancel(error)) return; // Canceled request
          console.error("Error fetching facets:", error);
        });
    };

    getFacets();
  }, [frente, area, filterParams]);

  useEffect(() => {
    setIsFiltered(activeFields.size > 0);
  }, [activeFields]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap justify-center lg:justify-normal">
        {facets.map((facet, index) => (
          <TableTicketFacetedFilter
            key={facet.field}
            title={facet.field}
            options={facet.options}
            onUpdateFilter={handleFilters}
            ref={(element: any) => (facetsRefs.current[index] = element)}
            area={area}
            formatDate={facet.field === "fecha"}
          />
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleCleanFilters}
            className="h-8 px-2 lg:px-3 text-primary hover:bg-green-50"
          >
            Limpiar Filtros
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
