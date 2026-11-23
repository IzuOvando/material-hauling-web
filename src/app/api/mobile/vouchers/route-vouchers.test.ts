/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { POST } from "./route";
import prisma from "@/lib/db";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";
import { vouchersFixture } from "@/app/api/fixtures/vouchersFixture";

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    material: { findFirst: jest.fn() },
    voucherCamion: { findMany: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  },
}));
jest.mock("@/auth/TokenAuthenticator", () => ({
  TokenAuthenticator: { verify: jest.fn(), decode: jest.fn() },
}));
jest.mock("@/actions/dashboard", () => ({ invalidateDashboardCache: jest.fn() }));
jest.mock("@/actions/trucks", () => ({ invalidateTrucksFacetsCache: jest.fn() }));

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  material: { findFirst: jest.Mock };
  voucherCamion: { findMany: jest.Mock; upsert: jest.Mock };
  $transaction: jest.Mock;
  $executeRaw: jest.Mock;
};

const URL = "http://localhost:3000/api/mobile/vouchers";

function buildRequest(body: string, token: string | null = "valid-token") {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new NextRequest(URL, { method: "POST", body, headers });
}

function authenticateAs(role: string, username = "checker") {
  (TokenAuthenticator.verify as jest.Mock).mockReturnValue(true);
  (TokenAuthenticator.decode as jest.Mock).mockReturnValue({ username, role });
}

describe("POST api/mobile/vouchers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    authenticateAs("owner");
    db.voucherCamion.findMany.mockResolvedValue([]);
    db.material.findFirst.mockResolvedValue(null);
    db.voucherCamion.upsert.mockImplementation((args) => args);
    db.$transaction.mockImplementation((ops) => Promise.resolve(ops));
    db.$executeRaw.mockResolvedValue(1);
  });

  it("returns 401 without a bearer token", async () => {
    const response = await POST(buildRequest(JSON.stringify(vouchersFixture), null));

    expect(response.status).toBe(401);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is invalid", async () => {
    (TokenAuthenticator.verify as jest.Mock).mockReturnValue(false);

    const response = await POST(buildRequest(JSON.stringify(vouchersFixture)));

    expect(response.status).toBe(401);
  });

  it("returns 400 if no data is provided", async () => {
    const response = await POST(buildRequest(JSON.stringify([])));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("No se proporcionaron datos de vouchers");
  });

  it("returns 400 for invalid JSON format", async () => {
    const response = await POST(buildRequest("{ invalid: json }"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Formato JSON inválido");
  });

  it("returns 400 when a voucher has no folio", async () => {
    const [first] = vouchersFixture;
    const response = await POST(buildRequest(JSON.stringify([{ ...first, folio: "  " }])));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Voucher [0] no trae folio válido");
  });

  it("returns 400 for an invalid turno", async () => {
    const [first] = vouchersFixture;
    const response = await POST(buildRequest(JSON.stringify([{ ...first, turno: 7 }])));

    expect(response.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns 403 when none of the vouchers belong to the user's frentes", async () => {
    authenticateAs("admin");
    db.user.findUnique.mockResolvedValue({ frentes: [{ frenteNombre: "OTRO-F1" }] });

    const response = await POST(buildRequest(JSON.stringify(vouchersFixture)));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.rejected).toHaveLength(vouchersFixture.length);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("creates vouchers, updates daily metrics and invalidates caches", async () => {
    const response = await POST(buildRequest(JSON.stringify(vouchersFixture)));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe("Vouchers procesados con éxito");
    expect(json.updated).toEqual(vouchersFixture.map((v) => v.folio));
    expect(db.voucherCamion.upsert).toHaveBeenCalledTimes(vouchersFixture.length);
    expect(db.$executeRaw).toHaveBeenCalledTimes(1);
    expect(invalidateDashboardCache).toHaveBeenCalledWith("T6F3");
    expect(invalidateTrucksFacetsCache).toHaveBeenCalledWith("T6F3");
  });

  it("does not count already existing folios in the daily metrics", async () => {
    db.voucherCamion.findMany.mockResolvedValue(vouchersFixture.map((v) => ({ folio: v.folio })));

    const response = await POST(buildRequest(JSON.stringify(vouchersFixture)));

    expect(response.status).toBe(201);
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it("returns 400 when the frente does not exist (P2003)", async () => {
    db.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("FK violation", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    const response = await POST(buildRequest(JSON.stringify(vouchersFixture)));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Uno o más frentes indicados no existen");
  });

  it("returns 500 on unexpected database error", async () => {
    db.$transaction.mockRejectedValue(new Error("Database error"));

    const response = await POST(buildRequest(JSON.stringify(vouchersFixture)));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Error interno del servidor");
  });
});
