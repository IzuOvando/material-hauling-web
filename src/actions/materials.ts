"use server";

import { kv } from "@vercel/kv";
import prisma from "@/lib/db";
import CONFIG from "@/config";
import { getAppUser } from "@/auth/auth.user";
import { normalizeMaterial } from "@/utils/normalizeMaterial";
import { invalidateDashboardCache } from "@/actions/dashboard";
import { invalidateTrucksFacetsCache } from "@/actions/trucks";

export interface UncatalogedMaterial {
  nombre: string;
  viajes: number;
  frentes: string[];
}

const UNCATALOGED_CACHE_KEY = "materials:uncataloged";
const UNCATALOGED_CACHE_TTL_SECONDS = 600;
const UNCATALOGED_TIMEOUT_MS = 5000;

async function bestEffort<T>(what: string, run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch (error) {
    console.error(`Failed to ${what}`, error);
    return undefined;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/** A catalog change relabels materials everywhere, so every frente's cached labels go ("*" matches all). */
async function invalidateLabelCaches() {
  await Promise.all([
    invalidateDashboardCache("*"),
    invalidateTrucksFacetsCache("*"),
    bestEffort("clear the uncataloged materials cache", () => kv.del(UNCATALOGED_CACHE_KEY)),
  ]);
}

// --- Catalog Actions ---

export async function getMaterials() {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  return prisma.material.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, isActive: true, createdAt: true },
  });
}

export async function createMaterial(nombre: string) {
  const material = await saveCatalogMaterial(nombre);
  await invalidateLabelCaches();
  return material;
}

async function saveCatalogMaterial(nombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = nombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del material no puede estar vacío");
  }

  const normalizedNombre = normalizeMaterial(trimmed);

  const existingByNormalized = await prisma.material.findUnique({
    where: { normalizedNombre },
  });

  if (existingByNormalized) {
    if (existingByNormalized.isActive) {
      throw new Error(`Ya existe un material similar: "${existingByNormalized.nombre}"`);
    }
    return prisma.material.update({
      where: { id: existingByNormalized.id },
      data: { isActive: true },
      select: { id: true, nombre: true, isActive: true },
    });
  }

  const existingByNombre = await prisma.material.findUnique({
    where: { nombre: trimmed },
  });

  if (existingByNombre) {
    if (existingByNombre.isActive) {
      throw new Error(`El material "${trimmed}" ya existe`);
    }
    return prisma.material.update({
      where: { id: existingByNombre.id },
      data: { isActive: true },
      select: { id: true, nombre: true, isActive: true },
    });
  }

  return prisma.material.create({
    data: { nombre: trimmed, normalizedNombre },
    select: { id: true, nombre: true, isActive: true },
  });
}

export async function renameMaterial(id: string, newNombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = newNombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del material no puede estar vacío");
  }

  const normalizedNombre = normalizeMaterial(trimmed);

  const conflictByNormalized = await prisma.material.findFirst({
    where: { normalizedNombre, NOT: { id } },
  });
  if (conflictByNormalized) {
    throw new Error(`Ya existe un material similar: "${conflictByNormalized.nombre}"`);
  }

  const conflictByNombre = await prisma.material.findFirst({
    where: { nombre: trimmed, NOT: { id } },
  });
  if (conflictByNombre) {
    throw new Error(`El material "${trimmed}" ya existe`);
  }

  const renamed = await prisma.material.update({
    where: { id },
    data: { nombre: trimmed, normalizedNombre },
    select: { id: true, nombre: true, isActive: true },
  });
  await invalidateLabelCaches();
  return renamed;
}

export async function deactivateMaterial(id: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  // Soft-delete the material and remove all frente assignments
  await prisma.$transaction([
    prisma.materialFrente.deleteMany({
      where: { materialId: id },
    }),
    prisma.material.update({
      where: { id },
      data: { isActive: false },
    }),
  ]);
  await invalidateLabelCaches();

  return { success: true };
}

/**
 * Materials used by vouchers saved in the last CONFIG.MATERIALS.UNCATALOGED_WINDOW_DAYS days
 * that have no active catalog match, grouped by normalized name. Concrete JSON specs and empty values
 * are not material names and are skipped. It is a warning, so it never fails the page:
 * on an error or a slow query it returns an empty list.
 */
export async function getUncatalogedMaterials(): Promise<UncatalogedMaterial[]> {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const cached = await bestEffort("read the uncataloged materials cache", () =>
    kv.get<UncatalogedMaterial[]>(UNCATALOGED_CACHE_KEY),
  );
  if (cached) return cached;

  const rows = await bestEffort("load the uncataloged materials", () =>
    withTimeout(queryUncatalogedMaterials(), UNCATALOGED_TIMEOUT_MS),
  );
  if (!rows) return [];

  await bestEffort("cache the uncataloged materials", () =>
    kv.set(UNCATALOGED_CACHE_KEY, rows, { ex: UNCATALOGED_CACHE_TTL_SECONDS }),
  );
  return rows;
}

async function queryUncatalogedMaterials(): Promise<UncatalogedMaterial[]> {
  return prisma.$queryRaw<UncatalogedMaterial[]>`
    SELECT MIN(v.material)                    AS nombre,
           COUNT(*)::int                      AS viajes,
           ARRAY_AGG(DISTINCT v."frenteNombre") AS frentes
    FROM "VoucherCamion" v
    LEFT JOIN "Material" m
      ON m."isActive" AND m."normalizedNombre" = immutable_unaccent(LOWER(TRIM(v.material)))
    WHERE v."createdAt" >= NOW() - (${CONFIG.MATERIALS.UNCATALOGED_WINDOW_DAYS} * INTERVAL '1 day')
      AND m.id IS NULL
      AND TRIM(v.material) NOT IN ('', 'undefined')
      AND LEFT(TRIM(v.material), 1) <> '{'
    GROUP BY immutable_unaccent(LOWER(TRIM(v.material)))
    ORDER BY viajes DESC, nombre
    LIMIT 50`;
}

// --- Frente Assignment Actions ---

export async function getFrenteMaterials(frenteNombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const [assigned, allActive] = await Promise.all([
    prisma.materialFrente.findMany({
      where: { frenteNombre },
      include: { material: { select: { id: true, nombre: true } } },
      orderBy: { material: { nombre: "asc" } },
    }),
    prisma.material.findMany({
      where: { isActive: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const assignedIds = new Set(assigned.map((a) => a.materialId));

  return {
    assigned: assigned.map((a) => a.material),
    available: allActive.filter((m) => !assignedIds.has(m.id)),
  };
}

export async function assignMaterialToFrente(
  materialId: string,
  frenteNombre: string
) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  // Validate material is active
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material || !material.isActive) {
    throw new Error("El material no existe o está inactivo");
  }

  // Validate frente exists
  const frente = await prisma.frente.findUnique({
    where: { nombre: frenteNombre },
  });
  if (!frente) {
    throw new Error("El frente no existe");
  }

  await prisma.materialFrente.create({
    data: { materialId, frenteNombre },
  });

  return { success: true };
}

export async function unassignMaterialFromFrente(
  materialId: string,
  frenteNombre: string
) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  await prisma.materialFrente.delete({
    where: {
      materialId_frenteNombre: { materialId, frenteNombre },
    },
  });

  return { success: true };
}
