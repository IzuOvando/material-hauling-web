/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { POST } from "./route";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { invalidateDashboardCache } from "@/actions/dashboard";

jest.mock("@/lib/db", () => {
  const db = {
    voucherCamion: { update: jest.fn() },
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
  voucherCamion: { update: jest.Mock };
  $executeRaw: jest.Mock;
  $transaction: jest.Mock;
};

const FRENTE = "TPCDMXP-F1";

const closedRow = (folio: string, cubicacion: number, turno: number) => ({
  frenteNombre: FRENTE,
  voucherDatetime: new Date("2026-10-20T15:00:00Z"),
  cubicacion,
  turno,
  status: "ARRIVED",
  folio,
});

const notFound = () =>
  new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "test",
  });

const close = (entries: unknown[]) =>
  POST(
    new NextRequest("http://localhost/api/trucks/closeCycles", {
      method: "POST",
      body: JSON.stringify({ entries }),
    }),
  );

/** Upsert values: frente, date, vouchers, trips, m3, turno1, turno2. */
const upserts = () =>
  db.$executeRaw.mock.calls.map(([, frente, date, vouchers, trips, m3, t1, t2]) => ({
    frente, date, vouchers, trips, m3, t1, t2,
  }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  (getAppUser as jest.Mock).mockResolvedValue({ name: "owner01", role: "owner" });
  db.$executeRaw.mockResolvedValue(1);
  db.$transaction.mockImplementation((fn) => fn(db));
});

describe("POST /api/trucks/closeCycles", () => {
  it("adds a trip only for the vouchers it actually closed", async () => {
    db.voucherCamion.update.mockImplementation(({ where }) =>
      where.folio === "B" ? Promise.reject(notFound()) : Promise.resolve(closedRow(where.folio, 14, 2)),
    );

    const response = await close([{ folio: "A" }, { folio: "B" }, { folio: "C" }]);
    const json = await response.json();

    expect(json.closed).toEqual(["A", "C"]);
    expect(json.failed).toEqual([{ folio: "B", reason: "No encontrado o ya cerrado." }]);
    expect(upserts()).toEqual([
      { frente: FRENTE, date: "2026-10-20", vouchers: 0, trips: 2, m3: 28, t1: 0, t2: 2 },
    ]);
    expect(invalidateDashboardCache).toHaveBeenCalledWith(FRENTE);
  });

  it("only closes vouchers that are still in transit", async () => {
    db.voucherCamion.update.mockResolvedValue(closedRow("A", 10, 1));

    await close([{ folio: "A", odometerArrival: 120, arrivalTime: "2026-10-20T16:00:00Z" }]);

    expect(db.voucherCamion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { folio: "A", status: "IN_TRANSIT" },
        data: expect.objectContaining({ status: "ARRIVED", odometerArrival: 120 }),
      }),
    );
  });

  it("rejects an invalid arrival date without touching the database", async () => {
    const response = await close([{ folio: "A", arrivalTime: "no-es-fecha" }]);
    const json = await response.json();

    expect(json.failed).toEqual([{ folio: "A", reason: "Fecha de llegada inválida." }]);
    expect(db.voucherCamion.update).not.toHaveBeenCalled();
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it("closes nothing and leaves the dashboard untouched on an unexpected error", async () => {
    db.voucherCamion.update
      .mockResolvedValueOnce(closedRow("A", 10, 1))
      .mockRejectedValueOnce(new Error("db down"));

    const response = await close([{ folio: "A" }, { folio: "B" }]);

    expect(response.status).toBe(500);
    expect(db.$executeRaw).not.toHaveBeenCalled();
    expect(invalidateDashboardCache).not.toHaveBeenCalled();
  });
});
