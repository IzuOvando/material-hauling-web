/**
 * @jest-environment node
 */

import prisma from "@/lib/db";
import { getTrucksFacets } from "./getTrucksFacets";
import { withCatalogMaterial, withMaterialVariants } from "./materialCatalog";

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    material: { findMany: jest.fn() },
    voucherCamion: { groupBy: jest.fn() },
  },
}));
jest.mock("@vercel/kv", () => ({ kv: {} }));

const db = prisma as unknown as {
  material: { findMany: jest.Mock };
  voucherCamion: { groupBy: jest.Mock };
};

const CATALOG = [
  { nombre: "Tepetate", normalizedNombre: "tepetate" },
  { nombre: "Base Hidráulica", normalizedNombre: "base hidraulica" },
];

beforeEach(() => {
  jest.clearAllMocks();
  db.material.findMany.mockResolvedValue(CATALOG);
});

describe("withCatalogMaterial", () => {
  it("shows the catalog spelling and keeps every other field", async () => {
    const result = await withCatalogMaterial([
      { folio: "a", material: "tepetate" },
      { folio: "b", material: "grazon" },
    ]);

    expect(result).toEqual([
      { folio: "a", material: "Tepetate" },
      { folio: "b", material: "grazon" },
    ]);
  });

  it("skips the catalog lookup when there is nothing to label", async () => {
    expect(await withCatalogMaterial([])).toEqual([]);
    expect(db.material.findMany).not.toHaveBeenCalled();
  });
});

describe("withMaterialVariants", () => {
  it("expands a catalog name to every spelling stored in the frente", async () => {
    db.voucherCamion.groupBy.mockResolvedValue([
      { material: "tepetate" },
      { material: "Tepetate " },
      { material: "Arena" },
    ]);

    const where = await withMaterialVariants("F1", { material: { in: ["Tepetate"] }, turno: { in: [1] } });

    expect(where).toEqual({
      material: { in: ["Tepetate", "tepetate", "Tepetate "] },
      turno: { in: [1] },
    });
    expect(db.voucherCamion.groupBy).toHaveBeenCalledWith({
      by: ["material"],
      where: { frenteNombre: "F1" },
    });
  });

  it("does not match materials that merely look alike", async () => {
    db.voucherCamion.groupBy.mockResolvedValue([{ material: "tepetates" }, { material: "base  hidraulica" }]);

    const where = await withMaterialVariants("F1", { material: { in: ["Tepetate"] } });

    expect(where).toEqual({ material: { in: ["Tepetate"] } });
  });

  it("does nothing, without querying, when no material is selected", async () => {
    expect(await withMaterialVariants("F1", null)).toBeNull();
    const other = { turno: { in: [1] } };
    expect(await withMaterialVariants("F1", other)).toBe(other);
    expect(db.voucherCamion.groupBy).not.toHaveBeenCalled();
  });
});

describe("getTrucksFacets material list", () => {
  it("merges spellings of the same catalog material and adds their counts", async () => {
    db.voucherCamion.groupBy.mockImplementation(({ by }: { by: string[] }) =>
      Promise.resolve(
        by[0] === "material"
          ? [
              { material: "Arena", _count: { material: 5 } },
              { material: "Base Hidráulica", _count: { material: 2 } },
              { material: "base hidraulica", _count: { material: 3 } },
              { material: "tepetate", _count: { material: 4 } },
            ]
          : [],
      ),
    );

    const facets = await getTrucksFacets("F1", undefined);

    expect(facets.material).toEqual([
      { value: "Arena", count: 5 },
      { value: "Base Hidráulica", count: 5 },
      { value: "Tepetate", count: 4 },
    ]);
  });
});
