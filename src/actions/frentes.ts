"use server";

import prisma from "@/lib/db";
import { getAppUser } from "@/auth/auth.user";
import type { Frente, TipoProyecto } from "@prisma/client";

export async function getAllFreentes(): Promise<Frente[]> {
  return prisma.frente.findMany({ orderBy: { nombre: "asc" } });
}

export async function updateFrenteDisplayName(
  nombre: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = displayName.trim();

  const frente = await prisma.frente.findUnique({ where: { nombre } });
  if (!frente) return { success: false, error: "Frente no encontrado." };

  await prisma.frente.update({
    where: { nombre },
    data: { displayName: trimmed || null },
  });

  return { success: true };
}

export async function updateFrenteTipoProyecto(
  nombre: string,
  tipoProyecto: TipoProyecto
): Promise<{ success: boolean; error?: string }> {
  const appUser = await getAppUser();
  if (!appUser || appUser.role !== "owner") {
    return { success: false, error: "Unauthorized" };
  }

  if (!["LINEAL", "FIJO"].includes(tipoProyecto)) {
    return { success: false, error: "Invalid tipoProyecto value" };
  }

  const frente = await prisma.frente.findUnique({ where: { nombre } });
  if (!frente) return { success: false, error: "Frente no encontrado." };

  await prisma.frente.update({
    where: { nombre },
    data: { tipoProyecto },
  });

  return { success: true };
}
