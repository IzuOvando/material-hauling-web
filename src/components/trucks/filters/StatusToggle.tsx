"use client";

import { CircleDot, CircleCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import type { StatusValue } from "@/types/trucks-filters";
import whiteLabelConfig from "../../../../white-label.config";

const OPTIONS: { value: StatusValue; label: string; activeClass: string; icon: typeof Circle }[] = [
  {
    value: "ALL",
    label: whiteLabelConfig.ui.trucksFilters.statusAll,
    activeClass: "bg-primary-light text-white",
    icon: Circle,
  },
  {
    value: "IN_TRANSIT",
    label: whiteLabelConfig.ui.trucksFilters.statusInTransit,
    activeClass: "bg-secondary text-white",
    icon: CircleDot,
  },
  {
    value: "ARRIVED",
    label: whiteLabelConfig.ui.trucksFilters.statusArrived,
    activeClass: "bg-primary text-accent",
    icon: CircleCheck,
  },
];

export function StatusToggle() {
  const { state, setStatus } = useTrucksTable();

  return (
    <div
      role="radiogroup"
      aria-label={whiteLabelConfig.ui.trucksFilters.statusLabelPrefix}
      className="inline-flex items-center gap-1 p-1 rounded-full bg-primary-light/10 border border-primary-light/30"
    >
      {OPTIONS.map((opt) => {
        const active = state.status === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setStatus(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-semibold",
              "transition-colors whitespace-nowrap",
              active ? opt.activeClass : "text-primary hover:bg-primary-light/15"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
