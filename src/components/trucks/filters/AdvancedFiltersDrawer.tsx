"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import type {
  TrucksFacets,
  TurnoValue,
  TrucksFilterState,
} from "@/types/trucks-filters";
import { TrucksFacetedFilter } from "./TrucksFacetedFilter";
import { cn } from "@/lib/utils";

interface AdvancedFiltersDrawerProps {
  frente: string;
  filtersString: string | null;
}

const TURNO_OPTIONS: { value: TurnoValue; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "1", label: "1°" },
  { value: "2", label: "2°" },
];

export function AdvancedFiltersDrawer({
  frente,
  filtersString,
}: AdvancedFiltersDrawerProps) {
  const { state, applyAdvanced } = useTrucksTable();
  const [open, setOpen] = useState(false);
  const [facets, setFacets] = useState<TrucksFacets | null>(null);
  const [loadingFacets, setLoadingFacets] = useState(false);

  const [buffer, setBuffer] = useState<{
    material: string[];
    checkerName: string[];
    arrivalCheckerName: string[];
    turno: TurnoValue;
  }>({
    material: state.material,
    checkerName: state.checkerName,
    arrivalCheckerName: state.arrivalCheckerName,
    turno: state.turno,
  });

  const activeCount =
    state.material.length +
    state.checkerName.length +
    state.arrivalCheckerName.length +
    (state.turno !== "ALL" ? 1 : 0);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setBuffer({
        material: state.material,
        checkerName: state.checkerName,
        arrivalCheckerName: state.arrivalCheckerName,
        turno: state.turno,
      });
    }
    setOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    const source = axios.CancelToken.source();
    setLoadingFacets(true);
    const params = new URLSearchParams({ frente });
    if (filtersString) params.set("filters", filtersString);
    axios
      .get(`/api/trucks/facets?${params.toString()}`, {
        cancelToken: source.token,
      })
      .then((res) => setFacets(res.data.facets))
      .catch((error) => {
        if (!axios.isCancel(error)) console.error("Failed to load facets", error);
      })
      .finally(() => setLoadingFacets(false));
    return () => source.cancel();
  }, [open, frente, filtersString]);

  const handleApply = () => {
    const partial: Partial<TrucksFilterState> = {
      material: buffer.material,
      checkerName: buffer.checkerName,
      arrivalCheckerName: buffer.arrivalCheckerName,
      turno: buffer.turno,
    };
    applyAdvanced(partial);
    setOpen(false);
  };

  const handleReset = () => {
    setBuffer({
      material: [],
      checkerName: [],
      arrivalCheckerName: [],
      turno: "ALL",
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-2 border-2 border-primary-light text-primary",
            "hover:bg-primary hover:!text-accent-light",
            activeCount > 0 && "bg-primary text-accent hover:bg-primary-dark"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Más filtros</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-primary text-xs font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
      >
        <div className="px-6 pt-6 pb-4 border-b-2 border-primary-light/40">
          <SheetTitle className="text-2xl font-semibold text-primary">
            Filtros avanzados
          </SheetTitle>
          <SheetDescription className="text-sm text-primary/60 mt-1">
            Refina la lista con criterios adicionales.
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <DrawerSection title="Material">
            {loadingFacets && !facets ? (
              <SkeletonList />
            ) : (
              <TrucksFacetedFilter
                options={facets?.material ?? []}
                selected={buffer.material}
                onChange={(material) => setBuffer((b) => ({ ...b, material }))}
                placeholder="Buscar material…"
              />
            )}
          </DrawerSection>

          <DrawerSection title="Checador de salida">
            {loadingFacets && !facets ? (
              <SkeletonList />
            ) : (
              <TrucksFacetedFilter
                options={facets?.checkerName ?? []}
                selected={buffer.checkerName}
                onChange={(checkerName) =>
                  setBuffer((b) => ({ ...b, checkerName }))
                }
                placeholder="Buscar checador…"
              />
            )}
          </DrawerSection>

          <DrawerSection title="Checador de llegada">
            {loadingFacets && !facets ? (
              <SkeletonList />
            ) : (
              <TrucksFacetedFilter
                options={facets?.arrivalCheckerName ?? []}
                selected={buffer.arrivalCheckerName}
                onChange={(arrivalCheckerName) =>
                  setBuffer((b) => ({ ...b, arrivalCheckerName }))
                }
                placeholder="Buscar checador de llegada…"
              />
            )}
          </DrawerSection>

          <DrawerSection title="Turno">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-primary-light/10 border border-primary-light/30">
              {TURNO_OPTIONS.map((opt) => {
                const active = buffer.turno === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setBuffer((b) => ({ ...b, turno: opt.value }))
                    }
                    className={cn(
                      "h-8 px-4 rounded-full text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-accent"
                        : "text-primary hover:bg-primary-light/15"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </DrawerSection>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t-2 border-primary-light/40 bg-white">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-2 border-primary-light text-primary"
          >
            Restablecer
          </Button>
          <Button
            onClick={handleApply}
            className="bg-accent hover:bg-accent-dark text-white"
          >
            Aplicar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-primary/70 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-8 rounded-md bg-primary-light/10 animate-pulse"
        />
      ))}
    </div>
  );
}
