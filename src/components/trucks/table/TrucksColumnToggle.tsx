"use client";

import { SlidersHorizontal as MixerHorizontalIcon } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TrucksColumnToggleProps<TData> {
  table: Table<TData>;
}

export function TrucksColumnToggle<TData>({ table }: TrucksColumnToggleProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-2 border-primary-light text-primary hover:bg-primary hover:!text-accent-light"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="w-full h-[50vh]">
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize cursor-pointer"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
