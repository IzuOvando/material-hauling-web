/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { invalidateDashboardCache } from "@/actions/dashboard";

jest.mock("@/lib/db", () => {
  const db = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  return { __esModule: true, default: db };
});
jest.mock("@/auth/auth.user", () => ({ getAppUser: jest.fn() }));
jest.mock("@/actions/dashboard", () => ({ invalidateDashboardCache: jest.fn() }));
jest.mock("@/actions/trucks", () => ({ invalidateTrucksFacetsCache: jest.fn() }));
jest.mock("@/auth/securityLogger", () => ({
  ...jest.requireActual("@/auth/securityLogger"),
  logSecurityEvent: jest.fn(),
}));

const db = prisma as unknown as {
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
  $transaction: jest.Mock;
};

const FRENTE = "TPCDMXP-F1";

const row = (iso: string, status: string, cubicacion: number, turno: number) => ({
  frenteNombre: FRENTE,
  voucherDatetime: new Date(iso),
  cubicacion,
  turno,
  status,
});

const deleteAll = () =>
  POST(
    new NextRequest("http://localhost/api/trucks/deleteVoucher", {
      method: "POST",
      body: JSON.stringify({ frenteNombre: FRENTE }),
    }),
  );

/** Deltas of the DashboardDailyMetrics update, in SQL order. */
const updates = () =>
  db.$executeRaw.mock.calls.map(([, vouchers, trips, m3, t1, t2, frente, date]) => ({
    frente, date, vouchers, trips, m3, t1, t2,
  }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  (getAppUser as jest.Mock).mockResolvedValue({ name: "owner01", role: "owner" });
  db.$queryRaw.mockResolvedValue([
    row("2026-10-20T15:00:00Z", "ARRIVED", 14, 1),
    row("2026-10-20T16:00:00Z", "IN_TRANSIT", 7, 2),
    row("2026-10-21T05:30:00Z", "ARRIVED", 8, 2),
  ]);
  db.$executeRaw.mockResolvedValue(1);
  db.$transaction.mockImplementation((fn) => fn(db));
});

describe("POST /api/trucks/deleteVoucher", () => {
  it("only lets owners delete", async () => {
    (getAppUser as jest.Mock).mockResolvedValue({ name: "checker", role: "general" });

    expect((await deleteAll()).status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("subtracts exactly the rows the DELETE returned, vouchers and trips separately", async () => {
    const response = await deleteAll();

    expect((await response.json()).message).toMatch(/Se eliminaron 3 registros/);
    expect(db.$queryRaw.mock.calls[0][1]).toBe(FRENTE);
    expect(updates()).toEqual([
      { frente: FRENTE, date: "2026-10-20", vouchers: -3, trips: -2, m3: -22, t1: -1, t2: -1 },
    ]);
    expect(invalidateDashboardCache).toHaveBeenCalledWith(FRENTE);
  });

  it("leaves the dashboard untouched when the delete fails", async () => {
    db.$queryRaw.mockRejectedValue(new Error("db down"));

    const response = await deleteAll();

    expect(response.status).toBe(500);
    expect(db.$executeRaw).not.toHaveBeenCalled();
    expect(invalidateDashboardCache).not.toHaveBeenCalled();
  });
});
