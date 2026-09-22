"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import { STATUS_LABELS, TURNO_LABELS } from "./labels";
import { getPeriodChipLabel } from "./PeriodPills";
import whiteLabelConfig from "#/white-label.config";

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1 rounded-full",
        "border-primary bg-primary/5 text-primary font-medium"
      )}
    >
      <span className="truncate max-w-[200px]">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-primary/20"
        aria-label={`${whiteLabelConfig.ui.trucksFilters.removeFilterPrefix} ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function joinedLabel(field: string, values: string[]): string {
  if (values.length <= 2) return `${field}: ${values.join(", ")}`;
  return `${field}: ${values[0]} +${values.length - 1}`;
}

export function ActiveFilterChips() {
  const {
    state,
    setPeriod,
    setStatus,
    setSearch,
    setMaterial,
    setCheckerName,
    setArrivalCheckerName,
    setTurno,
    clearAll,
  } = useTrucksTable();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  chips.push({
    key: "period",
    label: `${whiteLabelConfig.ui.trucksFilters.periodLabelPrefix}: ${getPeriodChipLabel(state)}`,
    onRemove: () => setPeriod("yesterday"),
  });
  if (state.status !== "ALL") {
    chips.push({
      key: "status",
      label: `${whiteLabelConfig.ui.trucksFilters.statusLabelPrefix}: ${STATUS_LABELS[state.status]}`,
      onRemove: () => setStatus("ALL"),
    });
  }
  if (state.q.trim()) {
    chips.push({
      key: "q",
      label: `${whiteLabelConfig.ui.trucksFilters.searchLabelPrefix}: "${state.q}"`,
      onRemove: () => setSearch(""),
    });
  }
  if (state.material.length > 0) {
    chips.push({
      key: "material",
      label: joinedLabel(whiteLabelConfig.ui.filters.material, state.material),
      onRemove: () => setMaterial([]),
    });
  }
  if (state.checkerName.length > 0) {
    chips.push({
      key: "checkerName",
      label: joinedLabel(whiteLabelConfig.ui.filters.departureChecker, state.checkerName),
      onRemove: () => setCheckerName([]),
    });
  }
  if (state.arrivalCheckerName.length > 0) {
    chips.push({
      key: "arrivalCheckerName",
      label: joinedLabel(whiteLabelConfig.ui.filters.arrivalChecker, state.arrivalCheckerName),
      onRemove: () => setArrivalCheckerName([]),
    });
  }
  if (state.turno !== "ALL") {
    chips.push({
      key: "turno",
      label: `${whiteLabelConfig.ui.filters.shift}: ${TURNO_LABELS[state.turno]}`,
      onRemove: () => setTurno("ALL"),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary/60">
        {whiteLabelConfig.ui.trucksFilters.activeLabel}:
      </span>
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAll}
        className="h-7 px-2 text-xs text-primary hover:bg-primary/15"
      >
        {whiteLabelConfig.ui.trucksFilters.clearAllButton}
      </Button>
    </div>
  );
}
