"use client";

import { X } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { TableTicketFacetedFilter } from "./TableTicketFacetedFilter";
import { Ticket, TicketArea } from "@/types";
import { Acarreos, Gasolina } from "@prisma/client";
import { useMemo } from "react";

interface TableTicketFiltersProps<TData> {
  table: Table<TData>;
  tickets: Ticket[];
  area: TicketArea;
}

const setFilters = (tickets: Ticket[], area: TicketArea) => {
  let filters: {
    column: string;
    label: string;
    data: any[];
  }[] = [];

  if (area === TicketArea.ACARREOS) {
    const acarreos = tickets as Acarreos[];
    filters = [
      {
        column: "material",
        label: "Material",
        data: [...new Set(acarreos.map((ticket) => ticket.material))],
      },
      {
        column: "empresa",
        label: "Empresa",
        data: [...new Set(acarreos.map((ticket) => ticket.empresa))],
      },
      {
        column: "banco",
        label: "Banco",
        data: [...new Set(acarreos.map((ticket) => ticket.banco))],
      },
      {
        column: "fecha",
        label: "Fecha",
        data: [...new Set(acarreos.map((ticket) => ticket.fecha))],
      },
      {
        column: "operador",
        label: "Operador",
        data: [...new Set(acarreos.map((ticket) => ticket.operador))],
      },
      {
        column: "checador",
        label: "Checador",
        data: [...new Set(acarreos.map((ticket) => ticket.checador))],
      },
      {
        column: "idCamion",
        label: "IdCamion",
        data: [...new Set(acarreos.map((ticket) => ticket.idCamion))],
      },
      {
        column: "proyecto",
        label: "Proyecto",
        data: [...new Set(acarreos.map((ticket) => ticket.proyecto))],
      },
    ];
  } else {
    const gasolina = tickets as Gasolina[];
    filters = [
      {
        column: "fecha",
        label: "Fecha",
        data: [...new Set(gasolina.map((ticket) => ticket.fecha))],
      },
      {
        column: "placas",
        label: "Placas",
        data: [...new Set(gasolina.map((ticket) => ticket.placas))],
      },
      {
        column: "odometro",
        label: "Odometro",
        data: [...new Set(gasolina.map((ticket) => ticket.odometro))],
      },
      {
        column: "bomba",
        label: "Bomba",
        data: [...new Set(gasolina.map((ticket) => ticket.bomba))],
      },
    ];
  }

  return filters;
};

export function TableTicketFilters<TData>({
  table,
  tickets,
  area,
}: TableTicketFiltersProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const filters = useMemo(() => setFilters(tickets, area), [tickets, area]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap justify-center lg:justify-normal">
        {filters.map(
          (filter) =>
            table.getColumn(filter.column) && (
              <TableTicketFacetedFilter
                key={filter.column}
                column={table.getColumn(filter.column)}
                title={filter.label}
                options={filter.data}
              />
            )
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
