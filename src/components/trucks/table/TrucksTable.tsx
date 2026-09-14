"use client";

import { useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import type { VoucherCamion } from "@prisma/client";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { trucksColumns, DEFAULT_VISIBLE_COLUMNS } from "./columns";
import { TrucksPagination } from "./TrucksPagination";
import { TrucksColumnToggle } from "./TrucksColumnToggle";
import whiteLabelConfig from "../../../../white-label.config";

interface TrucksTableProps {
  vouchers: VoucherCamion[];
  total: number;
  page: number;
  limit: number;
}

export function TrucksTable({ vouchers, total, page, limit }: TrucksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_VISIBLE_COLUMNS
  );

  const table = useReactTable({
    data: vouchers,
    columns: trucksColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    manualSorting: true,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.folio,
    state: { sorting, columnVisibility },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <TrucksColumnToggle table={table} />
      </div>
      <div className="rounded-lg border-2 border-primary-light overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-primary-light">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-primary text-accent whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-primary-light border-b-2 hover:bg-green-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={trucksColumns.length}
                  className="h-24 text-center text-primary"
                >
                  {whiteLabelConfig.ui.vouchers.emptyResultsTitle}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TrucksPagination total={total} page={page} limit={limit} />
    </div>
  );
}
