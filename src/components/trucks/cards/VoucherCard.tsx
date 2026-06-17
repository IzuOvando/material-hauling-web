"use client";

import { ArrowRight, Clock, Package, Truck } from "lucide-react";
import type { VoucherCamion } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";
import { formatVolume } from "@/helpers/formatters/numbers";
import {
  formatIsoDate,
  formatTime12Hour,
} from "@/helpers/formatters/datetime";
import { getMaterialDescription } from "@/helpers/formatters/voucherMaterial";

interface VoucherCardProps {
  voucher: VoucherCamion;
  onClick: () => void;
}

export function VoucherCard({ voucher, onClick }: VoucherCardProps) {
  const arrived = voucher.status === "ARRIVED";
  const material = getMaterialDescription(voucher.material);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left w-full rounded-xl border bg-white overflow-hidden",
        "transition-all duration-200 ease-out",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30",
        "active:scale-[0.99] active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
    >
      {/* status stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          arrived ? "bg-primary" : "bg-secondary"
        )}
      />

      <div className="p-4 pl-5 flex flex-col gap-3">
        {/* header: folio + status */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-bold text-primary">
            {formatVoucherId(voucher.folio)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap",
              arrived
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                arrived ? "bg-primary" : "bg-secondary"
              )}
            />
            {arrived ? "Llegó" : "En tránsito"}
          </span>
        </div>

        {/* vehicle */}
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Truck className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-semibold">{voucher.idCamion}</span>
          {voucher.placas && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{voucher.placas}</span>
            </>
          )}
        </div>

        {/* material */}
        {material && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Package className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <span className="line-clamp-1">{material}</span>
          </div>
        )}

        {/* route */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <span className="truncate max-w-[42%]">{voucher.origen}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="truncate max-w-[42%]">{voucher.destino}</span>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {formatIsoDate(voucher.voucherDatetime)}
            <span className="text-slate-300">·</span>
            {formatTime12Hour(voucher.voucherDatetime)}
          </span>
          <span className="font-semibold text-slate-700">
            {formatVolume(voucher.cubicacion, true, true)}
          </span>
        </div>
      </div>
    </button>
  );
}
