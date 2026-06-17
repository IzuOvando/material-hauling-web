"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import { STATUS_LABELS, TURNO_LABELS } from "./labels";
import { getPeriodChipLabel } from "./PeriodPills";

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
        "border-primary-light bg-primary-light/5 text-primary font-medium"
      )}
    >
      <span className="truncate max-w-[200px]">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-primary-light/20"
        aria-label={`Quitar ${label}`}
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

  if (state.period !== "yesterday") {
    chips.push({
      key: "period",
      label: `Periodo: ${getPeriodChipLabel(state)}`,
      onRemove: () => setPeriod("yesterday"),
    });
  }
  if (state.status !== "ALL") {
    chips.push({
      key: "status",
      label: `Estatus: ${STATUS_LABELS[state.status]}`,
      onRemove: () => setStatus("ALL"),
    });
  }
  if (state.q.trim()) {
    chips.push({
      key: "q",
      label: `Búsqueda: "${state.q}"`,
      onRemove: () => setSearch(""),
    });
  }
  if (state.material.length > 0) {
    chips.push({
      key: "material",
      label: joinedLabel("Material", state.material),
      onRemove: () => setMaterial([]),
    });
  }
  if (state.checkerName.length > 0) {
    chips.push({
      key: "checkerName",
      label: joinedLabel("Checador salida", state.checkerName),
      onRemove: () => setCheckerName([]),
    });
  }
  if (state.arrivalCheckerName.length > 0) {
    chips.push({
      key: "arrivalCheckerName",
      label: joinedLabel("Checador llegada", state.arrivalCheckerName),
      onRemove: () => setArrivalCheckerName([]),
    });
  }
  if (state.turno !== "ALL") {
    chips.push({
      key: "turno",
      label: `Turno: ${TURNO_LABELS[state.turno]}`,
      onRemove: () => setTurno("ALL"),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary/60">
        Activos:
      </span>
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAll}
        className="h-7 px-2 text-xs text-primary hover:bg-primary-light/15"
      >
        Limpiar todo
      </Button>
    </div>
  );
}
