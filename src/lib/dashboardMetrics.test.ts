/**
 * @jest-environment node
 */

import { applyVoucherMetrics, refreshVoucherCaches, type MetricsVoucher } from "./dashboardMetrics";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";

jest.mock("@/actions/dashboard", () => ({ invalidateDashboardCache: jest.fn() }));
jest.mock("@/actions/trucks", () => ({ invalidateTrucksFacetsCache: jest.fn() }));

const tx = { $executeRaw: jest.fn().mockResolvedValue(1) };

const voucher = (
  iso: string,
  overrides: Partial<MetricsVoucher> = {},
): MetricsVoucher => ({
  frenteNombre: "F1",
  voucherDatetime: new Date(iso),
  cubicacion: 10,
  turno: 1,
  status: "ARRIVED",
  ...overrides,
});

const sqlOf = (call: unknown[]) => (call[0] as TemplateStringsArray).join("?");

/** Upsert values: frente, date, vouchers, trips, m3, turno1, turno2. */
const upserts = () =>
  tx.$executeRaw.mock.calls.map(([, frente, date, vouchers, trips, m3, t1, t2]) => ({
    frente, date, vouchers, trips, m3, t1, t2,
  }));

/** Update deltas: vouchers, trips, m3, turno1, turno2, then frente, date. */
const updates = () =>
  tx.$executeRaw.mock.calls.map(([, vouchers, trips, m3, t1, t2, frente, date]) => ({
    frente, date, vouchers, trips, m3, t1, t2,
  }));

beforeEach(() => jest.clearAllMocks());

describe("applyVoucherMetrics", () => {
  it("created: counts a voucher for every row and a trip only for ARRIVED ones", async () => {
    await applyVoucherMetrics(tx, "created", [
      voucher("2026-10-20T15:00:00Z", { turno: 1, cubicacion: 14 }),
      voucher("2026-10-20T16:00:00Z", { status: "IN_TRANSIT", turno: 2, cubicacion: 7 }),
    ]);

    expect(sqlOf(tx.$executeRaw.mock.calls[0])).toContain("ON CONFLICT");
    expect(upserts()).toEqual([
      { frente: "F1", date: "2026-10-20", vouchers: 2, trips: 1, m3: 14, t1: 1, t2: 0 },
    ]);
  });

  it("arrived: adds the trip without counting the voucher again", async () => {
    await applyVoucherMetrics(tx, "arrived", [voucher("2026-10-20T15:00:00Z", { turno: 2, cubicacion: 12.5 })]);

    expect(upserts()).toEqual([
      { frente: "F1", date: "2026-10-20", vouchers: 0, trips: 1, m3: 12.5, t1: 0, t2: 1 },
    ]);
  });

  it("removed: subtracts the voucher, and the trip only if it had arrived", async () => {
    await applyVoucherMetrics(tx, "removed", [
      voucher("2026-10-20T15:00:00Z", { cubicacion: 14 }),
      voucher("2026-10-20T16:00:00Z", { status: "IN_TRANSIT", cubicacion: 7 }),
    ]);

    expect(sqlOf(tx.$executeRaw.mock.calls[0])).toMatch(/UPDATE "DashboardDailyMetrics"[\s\S]*GREATEST/);
    expect(updates()).toEqual([
      { frente: "F1", date: "2026-10-20", vouchers: -2, trips: -1, m3: -14, t1: -1, t2: 0 },
    ]);
  });

  it("buckets by Mexico City day and by frente", async () => {
    await applyVoucherMetrics(tx, "created", [
      voucher("2026-10-21T05:30:00Z"),
      voucher("2026-10-21T06:15:00Z"),
      voucher("2026-10-21T06:15:00Z", { frenteNombre: "F2" }),
    ]);

    expect(upserts().map(({ frente, date, vouchers }) => ({ frente, date, vouchers }))).toEqual([
      { frente: "F1", date: "2026-10-20", vouchers: 1 },
      { frente: "F1", date: "2026-10-21", vouchers: 1 },
      { frente: "F2", date: "2026-10-21", vouchers: 1 },
    ]);
  });

  it("does nothing for an empty change set", async () => {
    await applyVoucherMetrics(tx, "removed", []);

    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });
});

describe("refreshVoucherCaches", () => {
  it("clears each affected frente once", async () => {
    await refreshVoucherCaches([
      voucher("2026-10-20T15:00:00Z"),
      voucher("2026-10-21T15:00:00Z"),
      voucher("2026-10-21T15:00:00Z", { frenteNombre: "F2" }),
    ]);

    expect((invalidateDashboardCache as jest.Mock).mock.calls).toEqual([["F1"], ["F2"]]);
    expect((invalidateTrucksFacetsCache as jest.Mock).mock.calls).toEqual([["F1"], ["F2"]]);
  });
});
