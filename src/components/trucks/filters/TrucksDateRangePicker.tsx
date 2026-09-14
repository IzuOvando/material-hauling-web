"use client";

import * as React from "react";
import { DayPicker, type DateRange as RDPDateRange } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, parse, isValid } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import whiteLabelConfig from "../../../../white-label.config";

interface TrucksDateRangePickerProps {
  value: { from: string; to: string } | null;
  onChange: (range: { from: string; to: string }) => void;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function TrucksDateRangePicker({
  value,
  onChange,
  trigger,
  align = "start",
}: TrucksDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internal, setInternal] = React.useState<RDPDateRange | undefined>();

  React.useEffect(() => {
    if (!value) {
      setInternal(undefined);
      return;
    }
    const from = parse(value.from, "yyyy-MM-dd", new Date());
    const to = parse(value.to, "yyyy-MM-dd", new Date());
    setInternal({
      from: isValid(from) ? from : undefined,
      to: isValid(to) ? to : undefined,
    });
  }, [value, open]);

  const handleApply = () => {
    if (internal?.from && internal?.to) {
      onChange({
        from: format(internal.from, "yyyy-MM-dd"),
        to: format(internal.to, "yyyy-MM-dd"),
      });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-2 border-primary-light"
        align={align}
      >
        <div className="p-3">
          <DayPicker
            mode="range"
            numberOfMonths={2}
            selected={internal}
            onSelect={setInternal}
            locale={es}
            showOutsideDays
            classNames={{
              months: "flex flex-col sm:flex-row gap-4",
              month: "space-y-3",
              caption: "flex justify-center pt-1 relative items-center px-8",
              caption_label:
                "text-sm font-semibold text-primary capitalize",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 text-accent hover:text-accent-dark",
                "flex items-center justify-center rounded-md hover:bg-accent/10"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-primary/50 rounded-md w-9 font-normal text-[0.8rem] uppercase",
              row: "flex w-full mt-2",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative",
                "[&:has([aria-selected])]:bg-accent/10",
                "first:[&:has([aria-selected])]:rounded-l-md",
                "last:[&:has([aria-selected])]:rounded-r-md",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal text-primary rounded-md",
                "hover:bg-accent/10 aria-selected:opacity-100",
                "flex items-center justify-center"
              ),
              // NOTE: react-day-picker (v8) applies `day_selected` to EVERY day in
              // the range — including the middle ones — and layers the range
              // modifier on top. Plain utilities tie on specificity, so the middle
              // days were rendering dark text on a dark fill (invisible numbers).
              // The range classes are prefixed with `aria-selected:` so they win the
              // tie and keep every number legible.
              day_selected:
                "bg-primary text-accent hover:bg-primary-dark hover:text-accent focus:bg-primary focus:text-accent rounded-md",
              day_range_start:
                "aria-selected:bg-primary aria-selected:text-accent rounded-l-md rounded-r-none",
              day_range_end:
                "aria-selected:bg-primary aria-selected:text-accent rounded-r-md rounded-l-none",
              day_range_middle:
                "aria-selected:bg-accent/20 aria-selected:text-primary rounded-none",
              day_today: "font-semibold text-accent",
              day_outside: "text-primary/30 opacity-50",
              day_disabled: "text-primary/30 opacity-50",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-primary-light/40 p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInternal(undefined);
              setOpen(false);
            }}
            className="border-2 border-primary-light text-primary"
          >
            {whiteLabelConfig.ui.trucksFilters.cancelButton}
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!internal?.from || !internal?.to}
            className="bg-accent hover:bg-accent-dark text-white"
          >
            {whiteLabelConfig.ui.trucksFilters.applyButton}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
