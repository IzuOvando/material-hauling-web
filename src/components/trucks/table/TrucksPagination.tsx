"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft as DoubleArrowLeftIcon,
  ChevronsRight as DoubleArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrucksTable } from "@/hooks/useTrucksTable";

interface TrucksPaginationProps {
  total: number;
  page: number;
  limit: number;
}

export function TrucksPagination({ total, page, limit }: TrucksPaginationProps) {
  const { setPage, setLimit } = useTrucksTable();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const cantGoBack = page <= 1;
  const cantGoForward = page >= totalPages;

  return (
    <div className="flex items-center justify-between px-2 flex-wrap gap-2">
      <div className="flex-1 text-sm font-semibold text-primary text-center md:text-start">
        Total: {total.toLocaleString("es-MX")} vouchers
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8 flex-wrap justify-center gap-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-semibold text-primary text-end">
            Filas por página
          </p>
          <Select
            value={`${limit}`}
            onValueChange={(value) => setLimit(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px] border-2 border-primary">
              <SelectValue className="text-primary" placeholder={limit} />
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
          Página {page} de {totalPages}
        </div>
        <div className="flex items-center gap-2 !m-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => setPage(1)}
            disabled={cantGoBack}
          >
            <span className="sr-only">Primera página</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => setPage(page - 1)}
            disabled={cantGoBack}
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => setPage(page + 1)}
            disabled={cantGoForward}
          >
            <span className="sr-only">Página siguiente</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light"
            onClick={() => setPage(totalPages)}
            disabled={cantGoForward}
          >
            <span className="sr-only">Última página</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
