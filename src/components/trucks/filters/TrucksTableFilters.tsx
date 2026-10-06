"use client";

import { useTrucksTable } from "@/hooks/useTrucksTable";
import { PeriodPills } from "./PeriodPills";
import { StatusToggle } from "./StatusToggle";
import { SearchInput } from "./SearchInput";
import { AdvancedFiltersDrawer } from "./AdvancedFiltersDrawer";
import { ActiveFilterChips } from "./ActiveFilterChips";

interface TrucksTableFiltersProps {
  frente: string;
}

export function TrucksTableFilters({ frente }: TrucksTableFiltersProps) {
  const { effectiveFiltersString } = useTrucksTable();

  return (
    <div className="rounded-lg border-2 border-primary bg-white p-4 space-y-4">
      {/* Quick filters: time period (left) · status (right). */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <PeriodPills />
        <StatusToggle />
      </div>

      <div className="h-px w-full bg-primary/50" />

      {/* Search grows to fill the row; advanced filters sit at the end. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <SearchInput />
        </div>
        <AdvancedFiltersDrawer
          frente={frente}
          filtersString={effectiveFiltersString}
        />
      </div>

      <ActiveFilterChips />
    </div>
  );
}
