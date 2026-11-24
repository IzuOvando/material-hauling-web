import { normalizeMaterial } from "./normalizeMaterial";

/** Catalog display names keyed by `Material.normalizedNombre`. */
export type MaterialLabels = ReadonlyMap<string, string>;

export function toMaterialLabels(
  catalog: ReadonlyArray<{ nombre: string; normalizedNombre: string }>,
): MaterialLabels {
  return new Map(catalog.map((m) => [m.normalizedNombre, m.nombre]));
}

/** Concrete vouchers store a JSON spec in `material`; it is not a catalog name. */
function isStructuredMaterial(value: string): boolean {
  return value.trimStart().startsWith("{");
}

export function resolveMaterialLabel(stored: string, labels: MaterialLabels): string {
  if (!stored || isStructuredMaterial(stored)) return stored;
  return labels.get(normalizeMaterial(stored)) ?? stored;
}
