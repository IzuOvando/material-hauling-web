"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { VoucherCamion } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { TrucksColumnHeader } from "./TrucksColumnHeader";
import {
  formatIsoDate,
  formatTime12Hour,
} from "@/helpers/formatters/datetime";
import { formatVolume } from "@/helpers/formatters/numbers";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";
import whiteLabelConfig from "../../../../white-label.config";

export const trucksColumns: ColumnDef<VoucherCamion>[] = [
  {
    accessorKey: "folio",
    header: ({ column }) => <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.folio} />,
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatVoucherId(row.getValue("folio"))}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.status} />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      if (status === "IN_TRANSIT") {
        return (
          <Badge className="bg-secondary text-white hover:bg-secondary border-transparent">
            {whiteLabelConfig.ui.dashboard.inTransit}
          </Badge>
        );
      }
      return (
        <Badge className="bg-primary text-accent hover:bg-primary border-transparent">
          Llegó
        </Badge>
      );
    },
  },
  {
    accessorKey: "idCamion",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.truckId} />
    ),
  },
  {
    accessorKey: "noEconomico",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.economicNumber} />
    ),
  },
  {
    accessorKey: "placas",
    header: ({ column }) => <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.plates} />,
  },
  {
    accessorKey: "material",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.material} />
    ),
  },
  {
    accessorKey: "origen",
    header: ({ column }) => <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.origin} />,
  },
  {
    accessorKey: "destino",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.destination} />
    ),
  },
  {
    accessorKey: "cubicacion",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.volume} />
    ),
    cell: ({ row }) => <>{formatVolume(row.getValue("cubicacion"), true)}</>,
  },
  {
    accessorKey: "odometer",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.originOdometer} />
    ),
  },
  {
    accessorKey: "odometerArrival",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.destinationOdometer} />
    ),
    cell: ({ row }) => {
      const odometerArrival = row.getValue("odometerArrival") as number | null;
      const status = row.original.status;
      if (
        (odometerArrival === null || odometerArrival === undefined) &&
        status === "IN_TRANSIT"
      ) {
        return <span className="italic text-accent font-semibold">{whiteLabelConfig.ui.dashboard.inTransit}</span>;
      }
      return <>{odometerArrival}</>;
    },
  },
  {
    id: "voucherDate",
    accessorFn: (row) => formatIsoDate(row.voucherDatetime),
    header: ({ column }) => <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.date} />,
    cell: ({ row }) => <>{row.getValue("voucherDate")}</>,
  },
  {
    id: "voucherTime",
    accessorFn: (row) => row.voucherDatetime,
    header: ({ column }) => <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.time} />,
    cell: ({ row }) => (
      <>{formatTime12Hour(row.getValue("voucherTime") as Date)}</>
    ),
  },
  {
    accessorKey: "arrivalTime",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.arrivalTime} />
    ),
    cell: ({ row }) => {
      const arrivalTime = row.getValue("arrivalTime") as Date | null;
      const status = row.original.status;
      if (!arrivalTime && status === "IN_TRANSIT") {
        return <span className="italic text-accent font-semibold">{whiteLabelConfig.ui.dashboard.inTransit}</span>;
      }
      return formatTime12Hour(arrivalTime);
    },
  },
  {
    accessorKey: "operador",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.operator} />
    ),
  },
  {
    accessorKey: "noEmpleado",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.operatorNumber} />
    ),
  },
  {
    accessorKey: "turno",
    header: ({ column }) => <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.shift} />,
    cell: ({ row }) => (
      <>{row.getValue("turno") === 1 ? "1°" : "2°"}</>
    ),
  },
  {
    accessorKey: "empresa",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.company} />
    ),
  },
  {
    accessorKey: "checkerName",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.departureChecker} />
    ),
  },
  {
    accessorKey: "checkerNo",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.departureCheckerNumber} />
    ),
    cell: ({ row }) => <>{row.getValue("checkerNo") ?? "—"}</>,
  },
  {
    accessorKey: "arrivalCheckerName",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.arrivalChecker} />
    ),
    cell: ({ row }) => {
      const v = row.getValue("arrivalCheckerName") as string | null;
      const status = row.original.status;
      if (!v && status === "IN_TRANSIT") {
        return <span className="italic text-accent font-semibold">{whiteLabelConfig.ui.dashboard.inTransit}</span>;
      }
      return <>{v ?? "—"}</>;
    },
  },
  {
    accessorKey: "arrivalCheckerEmployeeNumber",
    header: ({ column }) => (
      <TrucksColumnHeader column={column} title={whiteLabelConfig.ui.trucksTable.arrivalCheckerNumber} />
    ),
    cell: ({ row }) => {
      const v = row.getValue("arrivalCheckerEmployeeNumber") as string | null;
      const status = row.original.status;
      if (!v && status === "IN_TRANSIT") {
        return <span className="italic text-accent font-semibold">{whiteLabelConfig.ui.dashboard.inTransit}</span>;
      }
      return <>{v ?? "—"}</>;
    },
  },
];

export const DEFAULT_VISIBLE_COLUMNS: Record<string, boolean> = {
  folio: true,
  status: true,
  idCamion: true,
  noEconomico: true,
  placas: true,
  material: true,
  origen: true,
  destino: true,
  cubicacion: true,
  odometer: false,
  odometerArrival: false,
  voucherDate: true,
  voucherTime: true,
  arrivalTime: true,
  operador: false,
  noEmpleado: false,
  turno: true,
  empresa: false,
  checkerName: true,
  checkerNo: false,
  arrivalCheckerName: true,
  arrivalCheckerEmployeeNumber: false,
};
