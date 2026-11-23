/**
 * @jest-environment node
 */

import { kv } from "@vercel/kv";
import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";
import {
  createMaterial,
  deactivateMaterial,
  getUncatalogedMaterials,
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
    $queryRaw: jest.fn(),
  },
}));
jest.mock("@vercel/kv", () => ({ kv: { get: jest.fn(), set: jest.fn(), del: jest.fn() } }));
jest.mock("@/auth/auth.user", () => ({ getAppUser: jest.fn() }));
jest.mock("@/actions/dashboard", () => ({ invalidateDashboardCache: jest.fn() }));
jest.mock("@/actions/trucks", () => ({ invalidateTrucksFacetsCache: jest.fn() }));

const db = prisma as unknown as {
  material: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  materialFrente: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
};

const cache = kv as unknown as { get: jest.Mock; set: jest.Mock; del: jest.Mock };
const UNCATALOGED_KEY = "materials:uncataloged";

const expectAllCachesCleared = () => {
  expect(invalidateDashboardCache).toHaveBeenCalledWith("*");
  expect(invalidateTrucksFacetsCache).toHaveBeenCalledWith("*");
  expect(cache.del).toHaveBeenCalledWith(UNCATALOGED_KEY);
};

beforeEach(() => {
  jest.clearAllMocks();
  (getAppUser as jest.Mock).mockResolvedValue({ name: "owner01", role: "owner" });
  db.material.findUnique.mockResolvedValue(null);
  db.material.findFirst.mockResolvedValue(null);
  db.material.create.mockResolvedValue({ id: "1", nombre: "Tepetate", isActive: true });
  db.material.update.mockResolvedValue({ id: "1", nombre: "Tepetate", isActive: true });
  db.$transaction.mockResolvedValue([]);
  cache.get.mockResolvedValue(null);
  cache.set.mockResolvedValue("OK");
  cache.del.mockResolvedValue(1);
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

describe("getUncatalogedMaterials", () => {
  it("returns the materials the catalog doesn't recognize", async () => {
    db.$queryRaw.mockResolvedValue([{ nombre: "tepetate", viajes: 4, frentes: ["PROJ-A1"] }]);

    expect(await getUncatalogedMaterials()).toEqual([
      { nombre: "tepetate", viajes: 4, frentes: ["PROJ-A1"] },
    ]);
  });

  it("is owner only", async () => {
    (getAppUser as jest.Mock).mockResolvedValue({ name: "checker", role: "general" });

    await expect(getUncatalogedMaterials()).rejects.toThrow("No autorizado");
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it("only looks at the vouchers saved in the last 90 days", async () => {
    db.$queryRaw.mockResolvedValue([]);

    await getUncatalogedMaterials();

    const [sql, ...values] = db.$queryRaw.mock.calls[0];
    expect(sql.join("?")).toContain('v."createdAt" >= NOW()');
    expect(values).toContain(90);
  });

  it("serves the cached list without querying", async () => {
    const cached = [{ nombre: "grava", viajes: 2, frentes: ["F1"] }];
    cache.get.mockResolvedValue(cached);

    expect(await getUncatalogedMaterials()).toEqual(cached);
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it("caches what it found for ten minutes", async () => {
    const rows = [{ nombre: "grava", viajes: 2, frentes: ["F1"] }];
    db.$queryRaw.mockResolvedValue(rows);

    await getUncatalogedMaterials();

    expect(cache.set).toHaveBeenCalledWith(UNCATALOGED_KEY, rows, { ex: 600 });
  });

  it("still answers when the cache is down", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    cache.get.mockRejectedValue(new Error("redis down"));
    cache.set.mockRejectedValue(new Error("redis down"));
    db.$queryRaw.mockResolvedValue([{ nombre: "grava", viajes: 2, frentes: ["F1"] }]);

    expect(await getUncatalogedMaterials()).toHaveLength(1);
  });

  it("returns an empty list, and caches nothing, when the query fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    db.$queryRaw.mockRejectedValue(new Error("db down"));

    expect(await getUncatalogedMaterials()).toEqual([]);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("gives up on a query that takes too long instead of holding the page", async () => {
    jest.useFakeTimers();
    jest.spyOn(console, "error").mockImplementation(() => {});
    db.$queryRaw.mockReturnValue(new Promise(() => {}));

    const result = getUncatalogedMaterials();
    await jest.advanceTimersByTimeAsync(5000);

    expect(await result).toEqual([]);
    jest.useRealTimers();
  });
});
