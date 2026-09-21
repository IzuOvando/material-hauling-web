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
import whiteLabelConfig from "../../../../white-label.config";

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
          className="h-9 border-2 border-primary text-primary hover:bg-primary hover:!text-accent"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          {whiteLabelConfig.ui.trucksTable.columnsButton}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{whiteLabelConfig.ui.trucksTable.showColumnsLabel}</DropdownMenuLabel>
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
