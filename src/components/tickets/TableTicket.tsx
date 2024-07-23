"use client";
import { useEffect, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  getFacetedRowModel,
  getFacetedUniqueValues,
  TableOptions,
} from "@tanstack/react-table";
import { Acarreos, Gasolina } from "@prisma/client";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { TableTicketPagination } from "./TableTicketPagination";
import { TableTicketColumnToggle } from "./TableTicketColumnToggle";
import { TableTicketFilters } from "./TableTicketFilters";
import { Button } from "../ui/button";
import { PrintTicketDialog } from ".";
import { TicketArea, Ticket } from "@/types";
import { acarreosColumns, gasolinaColumns } from "./tableTicketsColumns";

interface TableTicketAcarreoProps {
  area: TicketArea.ACARREOS;
  tickets: Acarreos[];
}

interface TableTicketGasolinaProps {
  area: TicketArea.GASOLINA;
  tickets: Gasolina[];
}

type TableTicketProps = TableTicketAcarreoProps | TableTicketGasolinaProps;

const TableTicket = (props: TableTicketProps) => {
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  // Aux states
  const [disablePrintTickets, setDisablePrintTickets] = useState(true);
  const [openPrintTickets, setOpenPrintTickets] = useState(false);
  // Ticket states
  const [sortedTickets, setSortedTickets] = useState<Ticket[]>([]);

  const columns =
    props.area === TicketArea.ACARREOS ? acarreosColumns : gasolinaColumns;

  const optionsTable: TableOptions<any> = {
    data: props.tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.uuid,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  };

  const table = useReactTable(optionsTable);

  useEffect(() => {
    if (Object.keys(rowSelection).length === 0) setDisablePrintTickets(true);
    else setDisablePrintTickets(false);
  }, [rowSelection]);

  useEffect(() => {
    table.toggleAllRowsSelected(false);
    setRowSelection({});
  }, [columnFilters, table]);

  useEffect(() => {
    const sortedData = table
      .getSortedRowModel()
      .flatRows.map((row) => row.original);
    setSortedTickets(sortedData);
  }, [sorting, columnFilters]);

  return (
    <>
      <div className="flex items-center justify-center pb-4 flex-wrap lg:justify-start lg:flex-nowrap">
        <Button
          className="bg-accent hover:bg-accent-light active:bg-accent-dark lg:mr-3 mb-3 lg:mb-0"
          disabled={disablePrintTickets}
          onClick={() => setOpenPrintTickets(true)}
        >
          Imprimir Tickets
        </Button>
        <TableTicketFilters
          table={table}
          tickets={props.tickets}
          area={props.area}
        />
        <TableTicketColumnToggle table={table} />
      </div>
      <div className="rounded-lg border-2 border-primary-light overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-primary-light">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-primary text-accent"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-primary-light border-b-2 hover:bg-green-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay tickets que mostrar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3">
        <TableTicketPagination table={table} />
      </div>
      <PrintTicketDialog
        open={openPrintTickets}
        setOpen={setOpenPrintTickets}
        ticketsSelection={rowSelection}
        tickets={sortedTickets}
      />
    </>
  );
};

export default TableTicket;
