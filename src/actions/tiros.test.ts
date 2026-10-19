/**
 * @jest-environment node
 */
import {
  getTiros,
  createTiro,
  renameTiro,
  deactivateTiro,
  getFrenteTiros,
  assignTiroToFrente,
  unassignTiroFromFrente,
} from "./tiros";

jest.mock("@/auth/auth.user", () => ({
  getAppUser: jest.fn(),
}));

jest.mock("@/lib/db", () => {
  const mockPrisma = {
    tiroCatalogo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tiroFrente: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    frente: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { __esModule: true, default: mockPrisma };
});

import { getAppUser } from "@/auth/auth.user";
import prisma from "@/lib/db";

const mockGetAppUser = getAppUser as jest.MockedFunction<typeof getAppUser>;

describe("tiros actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppUser.mockResolvedValue({
      name: "testowner",
      role: "owner",
      frentes: [],
    });
  });

  describe("getTiros", () => {
    it("returns all tiros for owner", async () => {
      const mockData = [{ id: "1", nombre: "Relleno Sanitario", isActive: true, createdAt: new Date() }];
      (prisma.tiroCatalogo.findMany as jest.Mock).mockResolvedValue(mockData);

      const result = await getTiros();
      expect(result).toEqual(mockData);
      expect(prisma.tiroCatalogo.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, isActive: true, createdAt: true },
      });
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(getTiros()).rejects.toThrow("No autorizado");
    });
  });

  describe("createTiro", () => {
    it("creates a new tiro", async () => {
      (prisma.tiroCatalogo.findUnique as jest.Mock).mockResolvedValue(null);
      const created = { id: "1", nombre: "Relleno Sanitario", isActive: true };
      (prisma.tiroCatalogo.create as jest.Mock).mockResolvedValue(created);

      const result = await createTiro("Relleno Sanitario");
      expect(result).toEqual(created);
    });

    it("throws if active tiro with same name exists", async () => {
      const existing = { id: "1", nombre: "Relleno Sanitario", isActive: true };
      (prisma.tiroCatalogo.findUnique as jest.Mock).mockResolvedValue(existing);

      await expect(createTiro("Relleno Sanitario")).rejects.toThrow('Ya existe un tiro con ese nombre: "Relleno Sanitario"');
    });

    it("throws on empty name", async () => {
      await expect(createTiro("  ")).rejects.toThrow("El nombre del tiro no puede estar vacío");
    });
  });

  describe("deactivateTiro", () => {
    it("soft-deletes and removes all frente assignments", async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      const result = await deactivateTiro("1");
      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.tiroFrente.deleteMany({ where: { tiroId: "1" } }),
        prisma.tiroCatalogo.update({ where: { id: "1" }, data: { isActive: false } }),
      ]);
    });
  });

  describe("assignTiroToFrente", () => {
    it("creates junction record", async () => {
      (prisma.tiroCatalogo.findUnique as jest.Mock).mockResolvedValue({ id: "1", isActive: true });
      (prisma.frente.findUnique as jest.Mock).mockResolvedValue({ nombre: "PROJ-F1" });
      (prisma.tiroFrente.create as jest.Mock).mockResolvedValue({});

      const result = await assignTiroToFrente("1", "PROJ-F1");
      expect(result).toEqual({ success: true });
    });

    it("throws if tiro inactive", async () => {
      (prisma.tiroCatalogo.findUnique as jest.Mock).mockResolvedValue({ id: "1", isActive: false });

      await expect(assignTiroToFrente("1", "PROJ-F1")).rejects.toThrow("El tiro no existe o está inactivo");
    });
  });
});
