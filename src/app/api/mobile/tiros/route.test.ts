/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import prisma from "@/lib/db";

jest.mock("@/auth/TokenAuthenticator");
jest.mock("@/lib/db", () => {
  const mockPrisma = {
    frente: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    tiroFrente: { findMany: jest.fn() },
  };
  return { __esModule: true, default: mockPrisma };
});

const mockVerify = TokenAuthenticator.verify as jest.Mock;
const mockDecode = TokenAuthenticator.decode as jest.Mock;

function makeRequest(token?: string) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new NextRequest("http://localhost/api/mobile/tiros", { headers });
}

describe("GET /api/mobile/tiros", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 without token", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns tiros grouped by frente for owner", async () => {
    mockVerify.mockReturnValue(true);
    mockDecode.mockReturnValue({ username: "admin", role: "owner" });
    (prisma.frente.findMany as jest.Mock).mockResolvedValue([
      { nombre: "PROJ-F1" },
    ]);
    (prisma.tiroFrente.findMany as jest.Mock).mockResolvedValue([
      { frenteNombre: "PROJ-F1", tiro: { nombre: "Obra" } },
      { frenteNombre: "PROJ-F1", tiro: { nombre: "Banco de Tiro" } },
    ]);

    const res = await GET(makeRequest("valid-token"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tiros).toEqual({
      "PROJ-F1": ["Obra", "Banco de Tiro"],
    });
  });
});
