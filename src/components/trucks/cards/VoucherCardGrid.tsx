"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import type { VoucherCamion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useTrucksInfiniteVouchers } from "@/hooks/useTrucksInfiniteVouchers";
import { VoucherCard } from "./VoucherCard";
import { VoucherDetailSheet } from "./VoucherDetailSheet";

interface VoucherCardGridProps {
  frente: string;
  initialVouchers: VoucherCamion[];
  total: number;
  limit: number;
  appliedFilters: string;
  sort: string | null;
}

export function VoucherCardGrid({
  frente,
  initialVouchers,
  total,
  limit,
  appliedFilters,
  sort,
}: VoucherCardGridProps) {
  const { vouchers, total: liveTotal, hasMore, isLoadingMore, error, loadMore } =
    useTrucksInfiniteVouchers({
      frente,
      filtersString: appliedFilters,
      sort,
      limit,
      initialVouchers,
      initialTotal: total,
    });

  const [selected, setSelected] = useState<VoucherCamion | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Auto-load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, error, loadMore]);

  const openVoucher = (voucher: VoucherCamion) => {
    setSelected(voucher);
    setSheetOpen(true);
  };

  if (vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-lg border-2 border-dashed border-primary-light/50 bg-white">
        <PackageOpen className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">
          No hay vouchers que coincidan con los filtros aplicados.
        </p>
        <p className="text-xs text-slate-400">
          Ajusta el periodo o los filtros para ver resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vouchers.map((voucher) => (
          <VoucherCard
            key={voucher.folio}
            voucher={voucher}
            onClick={() => openVoucher(voucher)}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="flex items-center justify-center py-4">
        {isLoadingMore && (
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando más vouchers…
          </span>
        )}
        {error && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            className="border-2 border-primary-light text-primary"
          >
            Reintentar
          </Button>
        )}
        {!hasMore && !isLoadingMore && !error && (
          <span className="text-xs text-slate-400">
            {liveTotal === 0
              ? null
              : `Se muestran los ${liveTotal.toLocaleString("es-MX")} vouchers`}
          </span>
        )}
      </div>

      <VoucherDetailSheet
        voucher={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
