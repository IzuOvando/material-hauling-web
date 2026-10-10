"use server";

import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";

// --- Catalog Actions ---

export async function getOrigenes() {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  return prisma.origenCatalogo.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, isActive: true, createdAt: true },
  });
}

export async function createOrigen(nombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = nombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del origen no puede estar vacío");
  }

  const existing = await prisma.origenCatalogo.findUnique({
    where: { nombre: trimmed },
  });

  if (existing) {
    if (existing.isActive) {
      throw new Error(`Ya existe un origen con ese nombre: "${existing.nombre}"`);
    }
    return prisma.origenCatalogo.update({
      where: { id: existing.id },
      data: { isActive: true },
      select: { id: true, nombre: true, isActive: true },
    });
  }

  return prisma.origenCatalogo.create({
    data: { nombre: trimmed },
    select: { id: true, nombre: true, isActive: true },
  });
}

export async function renameOrigen(id: string, newNombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const trimmed = newNombre.trim();
  if (!trimmed) {
    throw new Error("El nombre del origen no puede estar vacío");
  }

  const conflict = await prisma.origenCatalogo.findFirst({
    where: { nombre: trimmed, NOT: { id } },
  });
  if (conflict) {
    throw new Error(`Ya existe un origen con ese nombre: "${conflict.nombre}"`);
  }

  return prisma.origenCatalogo.update({
    where: { id },
    data: { nombre: trimmed },
    select: { id: true, nombre: true, isActive: true },
  });
}

export async function deactivateOrigen(id: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  await prisma.$transaction([
    prisma.origenFrente.deleteMany({
      where: { origenId: id },
    }),
    prisma.origenCatalogo.update({
      where: { id },
      data: { isActive: false },
    }),
  ]);

  return { success: true };
}

// --- Frente Assignment Actions ---

export async function getFrenteOrigenes(frenteNombre: string) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const [assigned, allActive] = await Promise.all([
    prisma.origenFrente.findMany({
      where: { frenteNombre },
      include: { origen: { select: { id: true, nombre: true } } },
      orderBy: { origen: { nombre: "asc" } },
    }),
    prisma.origenCatalogo.findMany({
      where: { isActive: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const assignedIds = new Set(assigned.map((a) => a.origenId));

  return {
    assigned: assigned.map((a) => a.origen),
    available: allActive.filter((o) => !assignedIds.has(o.id)),
  };
}

export async function assignOrigenToFrente(
  origenId: string,
  frenteNombre: string
) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  const origen = await prisma.origenCatalogo.findUnique({
    where: { id: origenId },
  });
  if (!origen || !origen.isActive) {
    throw new Error("El origen no existe o está inactivo");
  }

  const frente = await prisma.frente.findUnique({
    where: { nombre: frenteNombre },
  });
  if (!frente) {
    throw new Error("El frente no existe");
  }

  try {
    await prisma.origenFrente.create({
      data: { origenId, frenteNombre },
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: true }; // Already assigned, treat as no-op
    }
    throw error;
  }

  return { success: true };
}

export async function unassignOrigenFromFrente(
  origenId: string,
  frenteNombre: string
) {
  const user = await getAppUser();
  if (!user || user.role !== "owner") {
    throw new Error("No autorizado");
  }

  await prisma.origenFrente.delete({
    where: {
      frenteNombre_origenId: { origenId, frenteNombre },
    },
  });

  return { success: true };
}
