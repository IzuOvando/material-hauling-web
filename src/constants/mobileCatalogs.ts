/**
 * Static catalog entries hardcoded in the mobile app.
 * These are always visible to checadores regardless of admin configuration.
 * The web admin must not create duplicates of these entries.
 */

export const MOBILE_STATIC_ORIGENES = [
  "Banco de Material",
  "Banco de Préstamo",
  "Préstamo Lateral",
  "Cantera",
  "Mina",
  "Planta",
  "Demolición",
  "Despalme",
] as const;

export const MOBILE_STATIC_TIROS = [
  "Banco de Tiro",
  "Centro de Acopio",
  "Centro de Reciclaje",
] as const;

/**
 * "Obra" is generated dynamically by mobile from the frente name
 * (e.g. "Obra TPCDMXP"). It is not a real catalog entry.
 */
export const MOBILE_DYNAMIC_TIROS = [
  { nombre: "Obra", nota: "(generado automaticamente)" },
] as const;

/** Reserved names that cannot be used for catalog entries */
export const RESERVED_NAMES = ["Otro"] as const;

// --- Helpers ---

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function isStaticOrigen(nombre: string): boolean {
  const n = normalize(nombre);
  return MOBILE_STATIC_ORIGENES.some((s) => normalize(s) === n);
}

export function isStaticTiro(nombre: string): boolean {
  const n = normalize(nombre);
  return MOBILE_STATIC_TIROS.some((s) => normalize(s) === n);
}

export function isReservedName(nombre: string): boolean {
  const n = normalize(nombre);
  return RESERVED_NAMES.some((s) => normalize(s) === n);
}

export function isObraReserved(nombre: string): boolean {
  return normalize(nombre) === "obra";
}
