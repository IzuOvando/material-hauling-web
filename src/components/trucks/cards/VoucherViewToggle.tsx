"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import type { VoucherView } from "@/types/trucks-filters";

const OPTIONS: { value: VoucherView; label: string; icon: typeof LayoutGrid }[] = [
  { value: "cards", label: "Tarjetas", icon: LayoutGrid },
  { value: "table", label: "Tabla", icon: Table2 },
];

export function VoucherViewToggle() {
  const { view, setView } = useTrucksTable();

  return (
    <div
      role="radiogroup"
      aria-label="Vista"
      className="inline-flex items-center gap-1 p-1 rounded-full bg-primary-light/10 border border-primary-light/30"
    >
      {OPTIONS.map((opt) => {
        const active = view === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setView(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-semibold",
              "transition-colors whitespace-nowrap",
              active
                ? "bg-primary text-accent"
                : "text-primary hover:bg-primary-light/15"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
