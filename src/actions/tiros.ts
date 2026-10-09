"use server";

import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";

// --- Catalog Actions ---

export async function getTiros() {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  return prisma.tiroCatalogo.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, isActive: true, createdAt: true },
  });
}

export async function createTiro(nombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = nombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del tiro no puede estar vacío");
  }

  const existing = await prisma.tiroCatalogo.findUnique({
    where: { nombre: trimmed },
  });

  if (existing) {
    if (existing.isActive) {
      throw new Error(`Ya existe un tiro con ese nombre: "${existing.nombre}"`);
    }
    return prisma.tiroCatalogo.update({
      where: { id: existing.id },
      data: { isActive: true },
      select: { id: true, nombre: true, isActive: true },
    });
  }

  return prisma.tiroCatalogo.create({
    data: { nombre: trimmed },
    select: { id: true, nombre: true, isActive: true },
  });
}

export async function renameTiro(id: string, newNombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = newNombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del tiro no puede estar vacío");
  }

  const conflict = await prisma.tiroCatalogo.findFirst({
    where: { nombre: trimmed, NOT: { id } },
  });
  if (conflict) {
    throw new Error(`Ya existe un tiro con ese nombre: "${conflict.nombre}"`);
  }

  return prisma.tiroCatalogo.update({
    where: { id },
    data: { nombre: trimmed },
    select: { id: true, nombre: true, isActive: true },
  });
}

export async function deactivateTiro(id: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  await prisma.$transaction([
    prisma.tiroFrente.deleteMany({
      where: { tiroId: id },
    }),
    prisma.tiroCatalogo.update({
      where: { id },
      data: { isActive: false },
    }),
  ]);

  return { success: true };
}

// --- Frente Assignment Actions ---

export async function getFrenteTiros(frenteNombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const [assigned, allActive] = await Promise.all([
    prisma.tiroFrente.findMany({
      where: { frenteNombre },
      include: { tiro: { select: { id: true, nombre: true } } },
      orderBy: { tiro: { nombre: "asc" } },
    }),
    prisma.tiroCatalogo.findMany({
      where: { isActive: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const assignedIds = new Set(assigned.map((a) => a.tiroId));

  return {
    assigned: assigned.map((a) => a.tiro),
    available: allActive.filter((t) => !assignedIds.has(t.id)),
  };
}

export async function assignTiroToFrente(
  tiroId: string,
  frenteNombre: string
) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const tiro = await prisma.tiroCatalogo.findUnique({
    where: { id: tiroId },
  });
  if (!tiro || !tiro.isActive) {
    throw new Error("El tiro no existe o está inactivo");
  }

  const frente = await prisma.frente.findUnique({
    where: { nombre: frenteNombre },
  });
  if (!frente) {
    throw new Error("El frente no existe");
  }

  await prisma.tiroFrente.create({
    data: { tiroId, frenteNombre },
  });

  return { success: true };
}

export async function unassignTiroFromFrente(
  tiroId: string,
  frenteNombre: string
) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  await prisma.tiroFrente.delete({
    where: {
      frenteNombre_tiroId: { tiroId, frenteNombre },
    },
  });

  return { success: true };
}
