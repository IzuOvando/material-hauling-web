"use client";

import { AlertCircle, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PeriodPreset, TrucksFilterState } from "@/types/trucks-filters";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import {
  formatMonthYear,
  formatRangeShort,
  getPeriodRange,
  isFullMonthRange,
} from "@/actions/trucks/periods";
import { TrucksDateRangePicker } from "./TrucksDateRangePicker";
import { MonthYearPicker } from "./MonthYearPicker";

const ORDER: Exclude<PeriodPreset, "custom" | "thisMonth">[] = [
  "yesterday",
  "today",
  "last7",
];

const LABEL: Record<Exclude<PeriodPreset, "custom">, string> = {
  yesterday: "Ayer",
  today: "Hoy",
  last7: "7 días",
  thisMonth: "Mes",
};

function pillClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold capitalize",
    "transition-colors whitespace-nowrap",
    active
      ? "bg-primary text-accent shadow-sm"
      : "border-2 border-primary-light/40 text-primary hover:bg-primary-light/10",
  );
}

export function PeriodPills() {
  const { state, setPeriod } = useTrucksTable();

  // A full calendar month — whether it came from the month picker (period
  // "custom") or matched the current month preset ("thisMonth").
  const isMonth = isFullMonthRange(state.range);
  // A custom range that is NOT a whole month is the actual "Rango…" selection.
  const isCustomRange = state.period === "custom" && !isMonth;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ORDER.map((preset) => {
        const active = state.period === preset;
        const isToday = preset === "today";
        return (
          <button
            key={preset}
            type="button"
            onClick={() => setPeriod(preset)}
            className={pillClass(active)}
            title={
              isToday
                ? "Datos del día en curso pueden estar incompletos"
                : undefined
            }
          >
            {LABEL[preset]}
            {isToday && (
              <AlertCircle
                className={cn(
                  "h-3.5 w-3.5",
                  active ? "text-accent-light" : "text-secondary/70",
                )}
                aria-label="Datos del día pueden estar incompletos"
              />
            )}
          </button>
        );
      })}

      <MonthYearPicker
        value={state.range}
        onChange={(range) => setPeriod("custom", range)}
        trigger={
          <button type="button" className={pillClass(isMonth)}>
            <CalendarDays className="h-4 w-4" />
            {isMonth && state.range ? formatMonthYear(state.range) : "Mes/Año"}
          </button>
        }
      />

      <TrucksDateRangePicker
        value={state.range}
        onChange={(range) => setPeriod("custom", range)}
        trigger={
          <button type="button" className={pillClass(isCustomRange)}>
            <CalendarRange className="h-4 w-4" />
            {isCustomRange && state.range
              ? formatRangeShort(state.range)
              : "Rango…"}
          </button>
        }
      />
    </div>
  );
}

export function getPeriodChipLabel(state: TrucksFilterState): string {
  if (state.range && isFullMonthRange(state.range)) {
    return formatMonthYear(state.range);
  }
  if (state.period === "custom" && state.range) {
    return formatRangeShort(state.range);
  }
  if (state.period !== "custom") {
    return LABEL[state.period];
  }
  return "Periodo";
}

export function getPeriodEffectiveRange(state: TrucksFilterState) {
  if (state.period === "custom" && state.range) return state.range;
  if (state.period !== "custom") return getPeriodRange(state.period);
  return null;
}
