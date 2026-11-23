/**
 * @jest-environment node
 */

import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";
import {
  createMaterial,
  deactivateMaterial,
  renameMaterial,
} from "./materials";

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    material: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    materialFrente: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("@/auth/auth.user", () => ({ getAppUser: jest.fn() }));
jest.mock("@/actions/dashboard", () => ({ invalidateDashboardCache: jest.fn() }));
jest.mock("@/actions/trucks", () => ({ invalidateTrucksFacetsCache: jest.fn() }));

const db = prisma as unknown as {
  material: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  materialFrente: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
};

const expectAllCachesCleared = () => {
  expect(invalidateDashboardCache).toHaveBeenCalledWith("*");
  expect(invalidateTrucksFacetsCache).toHaveBeenCalledWith("*");
};

beforeEach(() => {
  jest.clearAllMocks();
  (getAppUser as jest.Mock).mockResolvedValue({ name: "owner01", role: "owner" });
  db.material.findUnique.mockResolvedValue(null);
  db.material.findFirst.mockResolvedValue(null);
  db.material.create.mockResolvedValue({ id: "1", nombre: "Tepetate", isActive: true });
  db.material.update.mockResolvedValue({ id: "1", nombre: "Tepetate", isActive: true });
  db.$transaction.mockResolvedValue([]);
});

describe("catalog changes relabel materials everywhere", () => {
  it("clears the dashboard and filter caches of every frente when a material is created", async () => {
    await createMaterial("Tepetate");

    expectAllCachesCleared();
  });

  it("clears them when an inactive material is reactivated", async () => {
    db.material.findUnique.mockResolvedValueOnce({ id: "1", nombre: "Tepetate", isActive: false });

    await createMaterial("Tepetate");

    expect(db.material.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: true } }),
    );
    expectAllCachesCleared();
  });

  it("clears them on rename and on deactivation", async () => {
    await renameMaterial("1", "Tepetate fino");
    expectAllCachesCleared();

    jest.clearAllMocks();
    await deactivateMaterial("1");
    expectAllCachesCleared();
  });

  it("does not touch the caches when the change is rejected", async () => {
    db.material.findUnique.mockResolvedValueOnce({ id: "9", nombre: "Tepetate", isActive: true });

    await expect(createMaterial("tepetate")).rejects.toThrow(/Ya existe un material similar/);

    expect(invalidateDashboardCache).not.toHaveBeenCalled();
  });
});
