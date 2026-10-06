"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getMonthRange, isFullMonthRange, type DateRange } from "@/actions/trucks/periods";
import CONFIG from "@/config";
import whiteLabelConfig from "#/white-label.config";

// Derived from NEXT_PUBLIC_LOCALE via Intl, rather than a hardcoded Spanish
// array, so a different tenant locale gets correctly localized abbreviations.
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat(whiteLabelConfig.app.locale, { month: "short" }).format(
    new Date(2000, i, 1)
  )
);

interface MonthYearPickerProps {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
}

function nowInZone(): DateTime {
  return DateTime.now().setZone(CONFIG.TIMEZONE);
}

export function MonthYearPicker({
  value,
  onChange,
  trigger,
  align = "start",
}: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Selected month/year derived from the current value when it is a full month.
  const selected = React.useMemo(() => {
    if (value && isFullMonthRange(value)) {
      const dt = DateTime.fromISO(value.from, { zone: CONFIG.TIMEZONE });
      if (dt.isValid) return { year: dt.year, month: dt.month };
    }
    return null;
  }, [value]);

  // Year being browsed in the popover (independent from the committed value).
  const [viewYear, setViewYear] = React.useState<number>(
    selected?.year ?? nowInZone().year
  );

  // Keep the browsed year in sync each time the popover opens.
  React.useEffect(() => {
    if (open) setViewYear(selected?.year ?? nowInZone().year);
  }, [open, selected?.year]);

  const current = nowInZone();

  const handlePick = (month: number) => {
    onChange(getMonthRange(viewYear, month));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-2 border-primary"
        align={align}
      >
        <div className="flex items-center justify-between px-3 pt-3">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-accent hover:bg-accent/10"
            aria-label={whiteLabelConfig.ui.trucksFilters.previousYearLabel}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-primary">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={viewYear >= current.year}
            className="h-7 w-7 flex items-center justify-center rounded-md text-accent hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={whiteLabelConfig.ui.trucksFilters.nextYearLabel}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-3">
          {MONTH_LABELS.map((label, idx) => {
            const month = idx + 1;
            const isActive =
              selected?.year === viewYear && selected?.month === month;
            const isFuture =
              viewYear > current.year ||
              (viewYear === current.year && month > current.month);
            return (
              <button
                key={idx}
                type="button"
                disabled={isFuture}
                onClick={() => handlePick(month)}
                className={cn(
                  "h-9 w-16 rounded-md text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-accent"
                    : "text-primary hover:bg-accent/10",
                  isFuture && "opacity-30 hover:bg-transparent cursor-not-allowed"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
