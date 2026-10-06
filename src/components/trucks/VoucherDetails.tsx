"use client";

import { useEffect, useState } from "react";
import type { VoucherCamion } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";
import whiteLabelConfig from "#/white-label.config";
import { formatVolume } from "@/helpers/formatters/numbers";
import { getMaterialDescription } from "@/helpers/formatters/voucherMaterial";

interface Field {
  label: string;
  value: React.ReactNode;
}

interface VoucherDetailsProps {
  voucher: VoucherCamion;
  className?: string;
}

function StatusBadge({ status }: { status: VoucherCamion["status"] }) {
  const arrived = status === "ARRIVED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        arrived
          ? "bg-primary text-accent"
          : "bg-secondary/10 text-secondary"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          arrived ? "bg-accent" : "bg-secondary"
        )}
      />
      {arrived ? "Llegó" : "En tránsito"}
    </span>
  );
}

function Section({ title, fields }: { title: string; fields: Field[] }) {
  const visible = fields.filter(
    (f) => f.value !== undefined && f.value !== null && f.value !== ""
  );
  if (visible.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary/50">
        {title}
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {visible.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-[11px] text-slate-400">{label}</dt>
            <dd className="text-sm font-medium text-slate-800 break-words">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const inTransit = (
  <span className="italic text-accent font-semibold">{whiteLabelConfig.ui.dashboard.inTransit}</span>
);

export function VoucherDetails({ voucher, className }: VoucherDetailsProps) {
  const [localDateTime, setLocalDateTime] = useState<string>("…");

  useEffect(() => {
    if (voucher.voucherDatetime) {
      setLocalDateTime(
        new Date(voucher.voucherDatetime).toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
        })
      );
    }
  }, [voucher.voucherDatetime]);

  const isInTransit = voucher.status === "IN_TRANSIT";

  const arrivalDateTime = voucher.arrivalTime
    ? new Date(voucher.arrivalTime).toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
      })
    : null;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            Folio
          </p>
          <p className="font-mono text-lg font-bold text-primary">
            {formatVoucherId(voucher.folio)}
          </p>
        </div>
        <StatusBadge status={voucher.status} />
      </div>

      <Section
        title={whiteLabelConfig.ui.vouchers.vehicle}
        fields={[
          { label: "ID Camión", value: voucher.idCamion },
          { label: "No. Económico", value: voucher.noEconomico },
          { label: "Placas", value: voucher.placas },
          { label: "Empresa", value: voucher.empresa },
          { label: "Localidad", value: voucher.localidad },
        ]}
      />

      <Section
        title={whiteLabelConfig.ui.vouchers.load}
        fields={[
          { label: "Material", value: getMaterialDescription(voucher.material) },
          {
            label: "Cubicación",
            value: formatVolume(voucher.cubicacion, true, true),
          },
          { label: "Origen", value: voucher.origen },
          { label: "Destino", value: voucher.destino },
          {
            label: "Turno",
            value: voucher.turno === 1 ? "Primer turno" : "Segundo turno",
          },
        ]}
      />

      <Section
        title={whiteLabelConfig.ui.vouchers.route}
        fields={[
          { label: "Odómetro origen", value: voucher.odometer },
          {
            label: "Odómetro destino",
            value: isInTransit ? inTransit : voucher.odometerArrival,
          },
          { label: "Fecha / hora salida", value: localDateTime },
          {
            label: "Fecha / hora llegada",
            value: arrivalDateTime ?? (isInTransit ? inTransit : null),
          },
        ]}
      />

      <Section
        title={whiteLabelConfig.ui.vouchers.operatorAndCheckers}
        fields={[
          { label: "Operador", value: voucher.operador },
          { label: "No. Operador", value: voucher.noEmpleado },
          { label: "Checador salida", value: voucher.checkerName },
          { label: "No. Checador salida", value: voucher.checkerNo },
          {
            label: "Checador llegada",
            value: voucher.arrivalCheckerName ?? (isInTransit ? inTransit : null),
          },
          {
            label: "No. Checador llegada",
            value:
              voucher.arrivalCheckerEmployeeNumber ??
              (isInTransit ? inTransit : null),
          },
        ]}
      />
    </div>
  );
}
