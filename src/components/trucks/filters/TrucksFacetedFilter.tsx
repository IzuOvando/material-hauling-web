"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import whiteLabelConfig from "../../../../white-label.config";

export interface TrucksFacetOption {
  value: string;
  count: number;
}

interface TrucksFacetedFilterProps {
  options: TrucksFacetOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxHeight?: string;
}

export function TrucksFacetedFilter({
  options,
  selected,
  onChange,
  placeholder = (whiteLabelConfig as any)?.ui?.general?.searchPlaceholder ?? "Buscar…",
  emptyMessage = (whiteLabelConfig as any)?.ui?.general?.emptyMessage ?? "Sin resultados",
  maxHeight = "max-h-60",
}: TrucksFacetedFilterProps) {
  const selectedSet = new Set(selected);

  const toggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <Command className="rounded-md border-2 border-primary-light/40">
      <CommandInput placeholder={placeholder} className="text-primary" />
      <CommandList className={maxHeight}>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = selectedSet.has(option.value);
            return (
              <CommandItem
                key={option.value}
                className="cursor-pointer"
                onSelect={() => toggle(option.value)}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border-2 border-primary",
                    isSelected
                      ? "bg-primary-light text-accent"
                      : "opacity-50 [&_svg]:invisible"
                  )}
                >
                  <Check strokeWidth={3} className="h-3.5 w-3.5 text-accent" />
                </div>
                <span className="flex-1 truncate font-normal">
                  {option.value || "—"}
                </span>
                <span className="ml-2 font-mono text-xs text-primary/60">
                  {option.count}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        {selected.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={clearAll}
                className="justify-center text-center cursor-pointer font-medium text-primary"
              >
                Limpiar selección
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}
