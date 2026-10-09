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
  };
  return { __esModule: true, default: mockPrisma };
});

const mockVerify = TokenAuthenticator.verify as jest.Mock;
const mockDecode = TokenAuthenticator.decode as jest.Mock;

function makeRequest(token?: string) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new NextRequest("http://localhost/api/mobile/frentes", { headers });
}

describe("GET /api/mobile/frentes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 without token", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns all frentes for owner", async () => {
    mockVerify.mockReturnValue(true);
    mockDecode.mockReturnValue({ username: "admin", role: "owner" });
    (prisma.frente.findMany as jest.Mock).mockResolvedValue([
      { nombre: "PROJ-F1", tipoProyecto: "LINEAL" },
      { nombre: "PROJ-F2", tipoProyecto: "FIJO" },
    ]);

    const res = await GET(makeRequest("valid-token"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.frentes).toEqual([
      { nombre: "PROJ-F1", tipoProyecto: "LINEAL" },
      { nombre: "PROJ-F2", tipoProyecto: "FIJO" },
    ]);
  });

  it("returns only assigned frentes for user role", async () => {
    mockVerify.mockReturnValue(true);
    mockDecode.mockReturnValue({ username: "checker1", role: "user" });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      frentes: [{ frenteNombre: "PROJ-F1" }],
    });
    (prisma.frente.findMany as jest.Mock).mockResolvedValue([
      { nombre: "PROJ-F1", tipoProyecto: "FIJO" },
    ]);

    const res = await GET(makeRequest("valid-token"));
    const body = await res.json();

    expect(body.frentes).toHaveLength(1);
    expect(body.frentes[0].nombre).toBe("PROJ-F1");
  });
});
