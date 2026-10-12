/**
 * @jest-environment node
 */
import {
  getOrigenes,
  createOrigen,
  renameOrigen,
  deactivateOrigen,
  getFrenteOrigenes,
  assignOrigenToFrente,
  unassignOrigenFromFrente,
} from "./origenes";

// Mock auth
jest.mock("@/auth/auth.user", () => ({
  getAppUser: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/db", () => {
  const mockPrisma = {
    origenCatalogo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    origenFrente: {
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

describe("origenes actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppUser.mockResolvedValue({
      name: "testowner",
      role: "owner",
      frentes: [],
    });
  });

  describe("getOrigenes", () => {
    it("returns all origenes for owner", async () => {
      const mockData = [{ id: "1", nombre: "Gravera", isActive: true, createdAt: new Date() }];
      (prisma.origenCatalogo.findMany as jest.Mock).mockResolvedValue(mockData);

      const result = await getOrigenes();
      expect(result).toEqual(mockData);
      expect(prisma.origenCatalogo.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, isActive: true, createdAt: true },
      });
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(getOrigenes()).rejects.toThrow("No autorizado");
    });
  });

  describe("createOrigen", () => {
    it("creates a new origen", async () => {
      (prisma.origenCatalogo.findUnique as jest.Mock).mockResolvedValue(null);
      const created = { id: "1", nombre: "Gravera", isActive: true };
      (prisma.origenCatalogo.create as jest.Mock).mockResolvedValue(created);

      const result = await createOrigen("Gravera");
      expect(result).toEqual(created);
    });

    it("reactivates a soft-deleted origen with same name", async () => {
      const existing = { id: "1", nombre: "Gravera", isActive: false };
      (prisma.origenCatalogo.findUnique as jest.Mock).mockResolvedValue(existing);
      const reactivated = { id: "1", nombre: "Gravera", isActive: true };
      (prisma.origenCatalogo.update as jest.Mock).mockResolvedValue(reactivated);

      const result = await createOrigen("Gravera");
      expect(result).toEqual(reactivated);
    });

    it("throws if active origen with same name exists", async () => {
      const existing = { id: "1", nombre: "Gravera", isActive: true };
      (prisma.origenCatalogo.findUnique as jest.Mock).mockResolvedValue(existing);

      await expect(createOrigen("Gravera")).rejects.toThrow('Ya existe un origen con ese nombre: "Gravera"');
    });

    it("throws on empty name", async () => {
      await expect(createOrigen("  ")).rejects.toThrow("El nombre del origen no puede estar vacío");
    });
  });

  describe("renameOrigen", () => {
    it("renames an origen successfully", async () => {
      (prisma.origenCatalogo.findFirst as jest.Mock).mockResolvedValue(null);
      const updated = { id: "1", nombre: "Gravera Nueva", isActive: true };
      (prisma.origenCatalogo.update as jest.Mock).mockResolvedValue(updated);

      const result = await renameOrigen("1", "Gravera Nueva");
      expect(result).toEqual(updated);
    });

    it("throws if conflict exists with another origen", async () => {
      (prisma.origenCatalogo.findFirst as jest.Mock).mockResolvedValue({ id: "2", nombre: "Gravera" });

      await expect(renameOrigen("1", "Gravera")).rejects.toThrow('Ya existe un origen con ese nombre: "Gravera"');
    });

    it("throws on empty name", async () => {
      await expect(renameOrigen("1", "  ")).rejects.toThrow("El nombre del origen no puede estar vacío");
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(renameOrigen("1", "Gravera")).rejects.toThrow("No autorizado");
    });
  });

  describe("deactivateOrigen", () => {
    it("soft-deletes and removes all frente assignments", async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      const result = await deactivateOrigen("1");
      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.origenFrente.deleteMany({ where: { origenId: "1" } }),
        prisma.origenCatalogo.update({ where: { id: "1" }, data: { isActive: false } }),
      ]);
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(deactivateOrigen("1")).rejects.toThrow("No autorizado");
    });
  });

  describe("getFrenteOrigenes", () => {
    it("returns assigned and available origenes", async () => {
      const assignedData = [
        { origenId: "1", frenteNombre: "PROJ-F1", origen: { id: "1", nombre: "Gravera" } },
      ];
      const allActive = [
        { id: "1", nombre: "Gravera" },
        { id: "2", nombre: "Rio" },
      ];

      (prisma.origenFrente.findMany as jest.Mock).mockResolvedValue(assignedData);
      (prisma.origenCatalogo.findMany as jest.Mock).mockResolvedValue(allActive);

      const result = await getFrenteOrigenes("PROJ-F1");
      expect(result.assigned).toEqual([{ id: "1", nombre: "Gravera" }]);
      expect(result.available).toEqual([{ id: "2", nombre: "Rio" }]);
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(getFrenteOrigenes("PROJ-F1")).rejects.toThrow("No autorizado");
    });
  });

  describe("assignOrigenToFrente", () => {
    it("creates junction record", async () => {
      (prisma.origenCatalogo.findUnique as jest.Mock).mockResolvedValue({ id: "1", isActive: true });
      (prisma.frente.findUnique as jest.Mock).mockResolvedValue({ nombre: "PROJ-F1" });
      (prisma.origenFrente.create as jest.Mock).mockResolvedValue({});

      const result = await assignOrigenToFrente("1", "PROJ-F1");
      expect(result).toEqual({ success: true });
    });

    it("throws if origen inactive", async () => {
      (prisma.origenCatalogo.findUnique as jest.Mock).mockResolvedValue({ id: "1", isActive: false });

      await expect(assignOrigenToFrente("1", "PROJ-F1")).rejects.toThrow("El origen no existe o está inactivo");
    });

    it("throws if frente not found", async () => {
      (prisma.origenCatalogo.findUnique as jest.Mock).mockResolvedValue({ id: "1", isActive: true });
      (prisma.frente.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(assignOrigenToFrente("1", "PROJ-F1")).rejects.toThrow("El frente no existe");
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(assignOrigenToFrente("1", "PROJ-F1")).rejects.toThrow("No autorizado");
    });
  });

  describe("unassignOrigenFromFrente", () => {
    it("deletes junction record", async () => {
      (prisma.origenFrente.delete as jest.Mock).mockResolvedValue({});

      const result = await unassignOrigenFromFrente("1", "PROJ-F1");
      expect(result).toEqual({ success: true });
      expect(prisma.origenFrente.delete).toHaveBeenCalledWith({
        where: {
          frenteNombre_origenId: { origenId: "1", frenteNombre: "PROJ-F1" },
        },
      });
    });

    it("throws for non-owner", async () => {
      mockGetAppUser.mockResolvedValue({ name: "user1", role: "user", frentes: [] });
      await expect(unassignOrigenFromFrente("1", "PROJ-F1")).rejects.toThrow("No autorizado");
    });
  });
});
