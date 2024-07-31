import { ColumnDef } from "@tanstack/react-table";
import { TableTicketColumnHeader } from "./TableTicketColumnHeader";
import {
  TableTicketAllSelector,
  TableTicketRowSelector,
} from "./TableTicketSelectors";
import { Acarreos, Gasolina } from "@prisma/client";

export const acarreosColumns: ColumnDef<Acarreos>[] = [
  {
    id: "select",
    header: () => <TableTicketAllSelector />,
    cell: ({ row }) => <TableTicketRowSelector row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "uuid",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="UUID" />
    ),
  },
  {
    accessorKey: "folio",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Folio" />
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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
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

export const gasolinaColumns: ColumnDef<Gasolina>[] = [
  {
    id: "select",
    header: () => <TableTicketAllSelector />,
    cell: ({ row }) => <TableTicketRowSelector row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "folio",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Folio" />
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
    accessorKey: "litros",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Litros" />
    ),
  },
  {
    accessorKey: "precioUnitario",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Precio Unitario" />
    ),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Total" />
    ),
  },
  {
    accessorKey: "placas",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Placas" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "bomba",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Bomba" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "formatoPago",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="FormatoPago" />
    ),
  },
  {
    accessorKey: "autorizacion",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Autorización" />
    ),
  },
  {
    accessorKey: "saldoCompra",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="SaldoCompra" />
    ),
  },
];
