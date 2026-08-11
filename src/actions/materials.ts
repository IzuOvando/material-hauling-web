"use server";

import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import { normalizeMaterial } from "@/utils/normalizeMaterial";

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
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = nombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del material no puede estar vacío");
  }

  const normalizedNombre = normalizeMaterial(trimmed);

  // Check if material exists but is inactive — reactivate it
  const existing = await prisma.material.findUnique({
    where: { nombre: trimmed },
  });

  if (existing) {
    if (existing.isActive) {
      throw new Error(`El material "${trimmed}" ya existe`);
    }
    // Reactivate
    return prisma.material.update({
      where: { id: existing.id },
      data: { isActive: true },
      select: { id: true, nombre: true, isActive: true },
    });
  }

  return prisma.material.create({
    data: { nombre: trimmed, normalizedNombre },
    select: { id: true, nombre: true, isActive: true },
  });
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

  return { success: true };
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
