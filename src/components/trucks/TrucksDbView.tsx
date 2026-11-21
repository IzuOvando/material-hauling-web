"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Frente, VoucherCamion } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import { TrucksDbHeader } from "./TrucksDbHeader";
import { TrucksTableFilters, DownloadTrucksExcelButton } from "./filters";
import { TrucksTable } from "./table";
import { VoucherCardGrid, VoucherViewToggle } from "./cards";

interface TrucksDbViewProps {
  frente: string;
  frentes: Frente[];
  vouchers: VoucherCamion[];
  total: number;
  page: number;
  limit: number;
  appliedFilters: string;
  sort: string | null;
  isOwner: boolean;
  isReadOnly: boolean;
}

export function TrucksDbView({
  frente,
  frentes,
  vouchers,
  total,
  page,
  limit,
  appliedFilters,
  sort,
  isOwner,
  isReadOnly,
}: TrucksDbViewProps) {
  const { view } = useTrucksTable();
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  // The dimming only shows if the refresh takes over 300 ms, so a fast one looks
  // like a plain update.
  const refreshData = () => startRefresh(() => router.refresh());

  return (
    <div
      className={cn(
        "space-y-4 transition-opacity duration-200",
        isRefreshing && "pointer-events-none opacity-60 delay-300"
      )}
      aria-busy={isRefreshing}
    >
      <TrucksDbHeader
        frente={frente}
        frentes={frentes}
        readOnly={isReadOnly}
        isOwner={isOwner}
        canActOnVouchers={total > 0}
        appliedFilters={appliedFilters}
        total={total}
        onVouchersChanged={refreshData}
      />

      <TrucksTableFilters frente={frente} />

      {/* Results toolbar — count heading + view/export, right above the data. */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <h2 className="text-lg font-bold text-primary">
          {total.toLocaleString("es-MX")}{" "}
          <span className="font-medium text-slate-500">
            {total === 1 ? "voucher" : "vouchers"}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <VoucherViewToggle />
          <DownloadTrucksExcelButton frente={frente} total={total} />
        </div>
      </div>

      {view === "table" ? (
        <TrucksTable
          vouchers={vouchers}
          total={total}
          page={page}
          limit={limit}
        />
      ) : (
        <VoucherCardGrid
          frente={frente}
          initialVouchers={vouchers}
          total={total}
          limit={limit}
          appliedFilters={appliedFilters}
          sort={sort}
        />
      )}
    </div>
  );
}
