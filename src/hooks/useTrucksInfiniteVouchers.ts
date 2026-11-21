"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import type { VoucherCamion } from "@prisma/client";

interface UseTrucksInfiniteVouchersArgs {
  frente: string;
  filtersString: string | null;
  sort: string | null;
  limit: number;
  initialVouchers: VoucherCamion[];
  initialTotal: number;
}

interface UseTrucksInfiniteVouchersResult {
  vouchers: VoucherCamion[];
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  error: boolean;
  loadMore: () => void;
}

const DATE_FIELDS: (keyof VoucherCamion)[] = [
  "voucherDatetime",
  "arrivalTime",
  "createdAt",
];

/** API responses serialize Dates to ISO strings — revive the ones the UI uses. */
function reviveVoucher(raw: VoucherCamion): VoucherCamion {
  const out = { ...raw } as Record<string, unknown>;
  for (const field of DATE_FIELDS) {
    const value = out[field as string];
    if (typeof value === "string") out[field as string] = new Date(value);
  }
  return out as VoucherCamion;
}

export function useTrucksInfiniteVouchers({
  frente,
  filtersString,
  sort,
  limit,
  initialVouchers,
  initialTotal,
}: UseTrucksInfiniteVouchersArgs): UseTrucksInfiniteVouchersResult {
  const [vouchers, setVouchers] = useState<VoucherCamion[]>(initialVouchers);
  const [total, setTotal] = useState(initialTotal);
  const [loadedPage, setLoadedPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  // Reset on every fresh page-1 payload from the server, not only when the query
  // changes: router.refresh() (delete, close cycle) keeps the query but changes
  // the rows. A client re-render keeps the same reference, so loaded pages stay.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVouchers(initialVouchers);
    setTotal(initialTotal);
    setLoadedPage(1);
    setError(false);
    setIsLoadingMore(false);
  }, [initialVouchers, initialTotal]);

  const hasMore = vouchers.length < total;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setError(false);
    const nextPage = loadedPage + 1;
    const params = new URLSearchParams({
      frente,
      page: String(nextPage),
      limit: String(limit),
    });
    if (filtersString) params.set("filters", filtersString);
    if (sort) params.set("sort", sort);

    axios
      .get(`/api/trucks/data?${params.toString()}`)
      .then((res) => {
        const incoming: VoucherCamion[] = (res.data.vouchers ?? []).map(
          reviveVoucher
        );
        setVouchers((prev) => {
          const seen = new Set(prev.map((v) => v.folio));
          const merged = [...prev];
          for (const v of incoming) {
            if (!seen.has(v.folio)) merged.push(v);
          }
          return merged;
        });
        setTotal(res.data.total ?? total);
        setLoadedPage(nextPage);
      })
      .catch((err) => {
        console.error("Failed to load more vouchers", err);
        setError(true);
      })
      .finally(() => setIsLoadingMore(false));
  }, [
    isLoadingMore,
    hasMore,
    loadedPage,
    frente,
    limit,
    filtersString,
    sort,
    total,
  ]);

  return { vouchers, total, hasMore, isLoadingMore, error, loadMore };
}
