/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type { VoucherCamion } from "@prisma/client";
import { useTrucksInfiniteVouchers } from "./useTrucksInfiniteVouchers";

jest.mock("axios");

const voucher = (folio: string) => ({ folio }) as unknown as VoucherCamion;

type Args = Parameters<typeof useTrucksInfiniteVouchers>[0];
const base: Args = {
  frente: "TEST-F1",
  filtersString: "voucherDatetimeRange=2026-10-28..2026-10-28",
  sort: null,
  limit: 20,
  initialVouchers: [voucher("a"), voucher("b")],
  initialTotal: 2,
};

describe("useTrucksInfiniteVouchers", () => {
  it("shows the fresh list when the server refreshes with the same filters", () => {
    const { result, rerender } = renderHook((p: Args) => useTrucksInfiniteVouchers(p), {
      initialProps: base,
    });
    expect(result.current.vouchers).toHaveLength(2);

    // router.refresh() after a delete: same query, new (empty) data.
    rerender({ ...base, initialVouchers: [], initialTotal: 0 });

    expect(result.current.vouchers).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it("keeps the list when the parent re-renders with the same data", () => {
    const { result, rerender } = renderHook((p: Args) => useTrucksInfiniteVouchers(p), {
      initialProps: base,
    });
    rerender(base);
    expect(result.current.vouchers).toHaveLength(2);
  });
});
