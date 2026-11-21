/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import blobClient from "@/lib/blobClient";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { frente: { findUnique: jest.fn(), delete: jest.fn() } },
}));
jest.mock("@/auth/auth.user", () => ({ getAppUser: jest.fn() }));
jest.mock("@/lib/blobClient", () => ({
  __esModule: true,
  default: { deleteBlob: jest.fn() },
}));
jest.mock("@/actions/dashboard", () => ({ invalidateDashboardCache: jest.fn() }));
jest.mock("@/actions/trucks", () => ({ invalidateTrucksFacetsCache: jest.fn() }));
jest.mock("@/auth/securityLogger", () => ({
  ...jest.requireActual("@/auth/securityLogger"),
  logSecurityEvent: jest.fn(),
}));

const db = prisma as unknown as { frente: { findUnique: jest.Mock; delete: jest.Mock } };
const deleteBlob = blobClient.deleteBlob as jest.Mock;

const FRENTE = "PROJ-A1";
const LOGO = "https://blob/logo.png";

const deleteFrente = () =>
  POST(
    new NextRequest("http://localhost/api/files/deletefrente", {
      method: "POST",
      body: JSON.stringify({ nombre: FRENTE }),
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  (getAppUser as jest.Mock).mockResolvedValue({ name: "owner01", role: "owner" });
  db.frente.findUnique.mockResolvedValue({ logoUrl: LOGO });
  db.frente.delete.mockResolvedValue({});
  deleteBlob.mockResolvedValue(undefined);
});

describe("POST /api/files/deletefrente", () => {
  it("only lets owners delete a frente", async () => {
    (getAppUser as jest.Mock).mockResolvedValue({ name: "admin01", role: "admin" });

    expect((await deleteFrente()).status).toBe(403);
    expect(db.frente.delete).not.toHaveBeenCalled();
  });

  it("returns 404 and deletes nothing when the frente doesn't exist", async () => {
    db.frente.findUnique.mockResolvedValue(null);

    expect((await deleteFrente()).status).toBe(404);
    expect(db.frente.delete).not.toHaveBeenCalled();
    expect(deleteBlob).not.toHaveBeenCalled();
  });

  it("deletes the frente and its logo", async () => {
    const response = await deleteFrente();

    expect(response.status).toBe(200);
    expect(db.frente.delete).toHaveBeenCalledWith({ where: { nombre: FRENTE } });
    expect(deleteBlob).toHaveBeenCalledWith(LOGO);
  });

  it("clears the dashboard and filter caches so a recreated frente starts clean", async () => {
    await deleteFrente();

    expect(invalidateDashboardCache).toHaveBeenCalledWith(FRENTE);
    expect(invalidateTrucksFacetsCache).toHaveBeenCalledWith(FRENTE);
    expect(db.frente.delete.mock.invocationCallOrder[0]).toBeLessThan(
      (invalidateDashboardCache as jest.Mock).mock.invocationCallOrder[0],
    );
  });

  it("leaves the caches alone when deleting the frente fails", async () => {
    db.frente.delete.mockRejectedValue(new Error("db down"));

    expect((await deleteFrente()).status).toBe(500);
    expect(invalidateDashboardCache).not.toHaveBeenCalled();
    expect(invalidateTrucksFacetsCache).not.toHaveBeenCalled();
  });
});
