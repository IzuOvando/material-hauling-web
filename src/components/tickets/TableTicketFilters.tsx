"use client";

import { X } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { TableTicketFacetedFilter } from "./TableTicketFacetedFilter";
import { Ticket } from "@prisma/client";

interface TableTicketFiltersProps<TData> {
  table: Table<TData>;
  tickets: Ticket[];
}

export function TableTicketFilters<TData>({
  table,
  tickets,
}: TableTicketFiltersProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const materials = [...new Set(tickets.map((ticket) => ticket.material))];
  const enterprises = [...new Set(tickets.map((ticket) => ticket.empresa))];
  const dates = [...new Set(tickets.map((ticket) => ticket.fecha))];
  const operators = [...new Set(tickets.map((ticket) => ticket.operador))];
  const checkers = [...new Set(tickets.map((ticket) => ticket.checador))];
  const banks = [...new Set(tickets.map((ticket) => ticket.banco))];
  const projects = [...new Set(tickets.map((ticket) => ticket.proyecto))];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap justify-center lg:justify-normal">
        {table.getColumn("material") && (
          <TableTicketFacetedFilter
            column={table.getColumn("material")}
            title="Material"
            options={materials}
          />
        )}
        {table.getColumn("empresa") && (
          <TableTicketFacetedFilter
            column={table.getColumn("empresa")}
            title="Empresa"
            options={enterprises}
          />
        )}
        {table.getColumn("banco") && (
          <TableTicketFacetedFilter
            column={table.getColumn("banco")}
            title="Banco"
            options={banks}
          />
        )}
        {table.getColumn("fecha") && (
          <TableTicketFacetedFilter
            column={table.getColumn("fecha")}
            title="Fecha"
            options={dates}
          />
        )}
        {table.getColumn("operador") && (
          <TableTicketFacetedFilter
            column={table.getColumn("operador")}
            title="Operador"
            options={operators}
          />
        )}
        {table.getColumn("checador") && (
          <TableTicketFacetedFilter
            column={table.getColumn("checador")}
            title="Checador"
            options={checkers}
          />
        )}
        {table.getColumn("proyecto") && (
          <TableTicketFacetedFilter
            column={table.getColumn("proyecto")}
            title="Proyecto"
            options={projects}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3 text-primary hover:bg-green-50"
          >
            Limpiar Filtros
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
