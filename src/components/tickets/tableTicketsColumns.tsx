import { ColumnDef } from "@tanstack/react-table";
import { TableTicketColumnHeader } from "./TableTicketColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Acarreos, Gasolina } from "@prisma/client";

export const acarreosColumns: ColumnDef<Acarreos>[] = [
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
    accessorKey: "noEstacion",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="NoEstacion" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "noNota",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="NoNota" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "litros",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Litros" />
    ),
  },
  {
    accessorKey: "tipo",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Tipo" />
    ),
  },
  {
    accessorKey: "precio",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Precio" />
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
    accessorKey: "odometro",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Odometro" />
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
    accessorKey: "terminal",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Terminal" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "empresa",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Empresa" />
    ),
  },
  {
    accessorKey: "direccion",
    header: ({ column }) => (
      <TableTicketColumnHeader column={column} title="Direccion" />
    ),
  },
];
