"use server";

import prisma from "@/lib/db";
import type { Frente } from "@prisma/client";

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
