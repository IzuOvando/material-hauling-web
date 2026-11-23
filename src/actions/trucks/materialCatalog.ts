import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { normalizeMaterial } from "@/utils/normalizeMaterial";
import {
  resolveMaterialLabel,
  toMaterialLabels,
  type MaterialLabels,
} from "@/utils/materialLabel";

export async function getMaterialLabels(): Promise<MaterialLabels> {
  const catalog = await prisma.material.findMany({
    where: { isActive: true },
    select: { nombre: true, normalizedNombre: true },
  });
  return toMaterialLabels(catalog);
}

/** Replaces each voucher's stored material with its catalog spelling, so the catalog is the single source of display names. */
export async function withCatalogMaterial<T extends { material: string }>(
  vouchers: T[],
): Promise<T[]> {
  if (vouchers.length === 0) return vouchers;
  const labels = await getMaterialLabels();
  return vouchers.map((v) => ({ ...v, material: resolveMaterialLabel(v.material, labels) }));
}

/**
 * The material filter carries catalog names (that's what the filter list shows),
 * but vouchers keep whatever was stored. Expands the selection to every stored
 * spelling of the same material so "Tepetate" also finds `tepetate`.
 */
export async function withMaterialVariants(
  frente: string,
  extra: Prisma.VoucherCamionWhereInput | null,
): Promise<Prisma.VoucherCamionWhereInput | null> {
  const selected = (extra?.material as { in?: string[] } | undefined)?.in;
  if (!extra || !selected?.length) return extra;

  const wanted = new Set(selected.map(normalizeMaterial));
  const stored = await prisma.voucherCamion.groupBy({
    by: ["material"],
    where: { frenteNombre: frente },
  });
  const variants = stored.map((s) => s.material).filter((m) => wanted.has(normalizeMaterial(m)));

  return { ...extra, material: { in: [...new Set([...selected, ...variants])] } };
}
