"use client";
import { useEffect, useState } from "react";
import { Ticket } from "@prisma/client";
import {
  ColumnDef,
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
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TableTicketPagination } from "./TableTicketPagination";
import { TableTicketColumnHeader } from "./TableTicketColumnHeader";
import { TableTicketColumnToggle } from "./TableTicketColumnToggle";
import { TableTicketFilters } from "./TableTicketFilters";
import { Button } from "../ui/button";
import { PrintTicketDialog } from ".";
import useFrenteStore from "@/store/useFrenteStore";

const columns: ColumnDef<Ticket>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Seleccionar todo"
        className="border-2 border-accent-dark !text-primary data-[state=checked]:bg-accent-dark w-5 h-5 pt-[1px] pl-[1px] mt-1"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecccionar fila"
        className="border-2 border-primary !text-accent-dark data-[state=checked]:bg-primary w-5 h-5 pt-[1px] pl-[1px] mt-1"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "uuid",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Id" />
    ),
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Fecha" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "hora",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Hora" />
    ),
  },
  {
    accessorKey: "material",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Material" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "cubicacion",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Cubicacion" />
    ),
  },
  {
    accessorKey: "empresa",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Empresa" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "banco",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Banco" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "placas",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Placas" />
    ),
  },
  {
    accessorKey: "idCamion",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="IdCamion" />
    ),
  },
  {
    accessorKey: "operador",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Operador" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "noEmpleado",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="NoEmpleado" />
    ),
  },
  {
    accessorKey: "checador",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Checador" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "proyecto",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Proyecto" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];

const TableTicket = ({ tickets }: { tickets: Ticket[] }) => {
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  // Aux states
  const [disablePrintTickets, setDisablePrintTickets] = useState(true);
  const [openPrintTickets, setOpenPrintTickets] = useState(false);
  // Frentes
  const { selectedFrente } = useFrenteStore();
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (selectedFrente) {
      const associatedTickets = tickets.filter(ticket => ticket.frenteNombre === selectedFrente.nombre);
      setFilteredTickets(associatedTickets);
    } else {
      setFilteredTickets([]);
    }
  }, [selectedFrente, tickets]);

  const table = useReactTable({
    data: filteredTickets,
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
  });

  useEffect(() => {
    if (Object.keys(rowSelection).length === 0) setDisablePrintTickets(true);
    else setDisablePrintTickets(false);
  }, [rowSelection]);

  useEffect(() => {
    table.toggleAllRowsSelected(false);
    setRowSelection({});
  }, [columnFilters, table]);

  return (
    <>
      <div className="flex items-center pb-4">
        <Button
          className="bg-accent hover:bg-accent-light active:bg-accent-dark mr-3"
          disabled={disablePrintTickets}
          onClick={() => setOpenPrintTickets(true)}
        >
          Imprimir Tickets
        </Button>
        <TableTicketFilters table={table} tickets={tickets} />
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
        tickets={tickets}
      />
    </>
  );
};

export default TableTicket;
