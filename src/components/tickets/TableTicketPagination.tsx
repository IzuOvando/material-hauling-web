import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft as DoubleArrowLeftIcon,
  ChevronsRight as DoubleArrowRightIcon,
} from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableTicketPaginationProps<TData> {
  table: Table<TData>;
}

export function TableTicketPagination<TData>({
  table,
}: TableTicketPaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 flex-wrap gap-2">
      <div className="flex-1 text-sm text-muted-foreground font-semibold text-primary text-center md:text-start">
        {table.getFilteredSelectedRowModel().rows.length} de{" "}
        {table.getFilteredRowModel().rows.length} fila(s) seleccionadas
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8 flex-wrap justify-center gap-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-semibold text-primary text-end">
            Filas por página
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px] border-2 border-primary">
              <SelectValue
                className="text-primary"
                placeholder={table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem
                  className="cursor-pointer"
                  key={pageSize}
                  value={`${pageSize}`}
                >
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[115px] items-center justify-center text-sm font-semibold text-primary text-end !m-0">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2 !m-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a primer página</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a página previa</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a página siguiente</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a última página</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
