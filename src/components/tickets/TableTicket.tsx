"use client";
import { useEffect, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
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
import { useTicketsSelectionStore } from "@/store";

interface TableTicketAcarreoProps {
  area: TicketArea.ACARREOS;
  tickets: Acarreos[];
}

interface TableTicketGasolinaProps {
  area: TicketArea.GASOLINA;
  tickets: Gasolina[];
}

interface TableTicketGeneralProps {
  total: number;
  page: number;
  limit: number;
}

type TableTicketProps = (TableTicketAcarreoProps | TableTicketGasolinaProps) &
  TableTicketGeneralProps;

const TableTicket = (props: TableTicketProps) => {
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // Aux states
  const [disablePrintTickets, setDisablePrintTickets] = useState(true);
  const [openPrintTickets, setOpenPrintTickets] = useState(false);
  // Ticket states
  const [sortedTickets, setSortedTickets] = useState<Ticket[]>(props.tickets);
  // Stores
  const { selectedTickets, selectedAll } = useTicketsSelectionStore();

  const columns =
    props.area === TicketArea.ACARREOS ? acarreosColumns : gasolinaColumns;

  const optionsTable: TableOptions<any> = {
    data: props.tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row) => row.uuid,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  };

  const table = useReactTable(optionsTable);

  useEffect(() => {
    setDisablePrintTickets(
      !selectedAll && Object.keys(selectedTickets).length === 0
    );
  }, [selectedAll, selectedTickets]);

  // TODO: Reset selection when filters change

  // useEffect(() => {
  //   const sortedData = table
  //     .getSortedRowModel()
  //     .flatRows.map((row) => row.original);
  //   if (sortedData.length > 0) setSortedTickets(sortedData);
  // }, [sorting, columnFilters]);

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
        {/* <TableTicketFilters
          table={table}
          tickets={props.tickets}
          area={props.area}
        /> */}
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
                  data-state={
                    (selectedAll || selectedTickets[row.id]) && "selected"
                  }
                  className="border-primary-light border-b-2 hover:bg-green-50 data-[state=selected]:bg-green-50"
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
        <TableTicketPagination
          selectedRows={
            selectedAll ? props.total : Object.keys(selectedTickets).length
          }
          total={props.total}
          page={props.page}
          limit={props.limit}
        />
      </div>
      <PrintTicketDialog
        open={openPrintTickets}
        setOpen={setOpenPrintTickets}
        ticketsSelection={selectedTickets}
        tickets={sortedTickets}
      />
    </>
  );
};

export default TableTicket;
