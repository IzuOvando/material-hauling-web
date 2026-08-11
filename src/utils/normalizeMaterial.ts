/**
 * Normalizes a material name for consistent storage and comparison.
 * Strips diacritics (accents), trims whitespace, and lowercases.
 *
 * Used at ingestion time (mobile voucher API) and as the matching key
 * against Material.normalizedNombre in the catalog.
 *
 * Examples:
 *   "Base Hidráulica"  → "base hidraulica"
 *   "Basé Hidráulica " → "base hidraulica"
 *   "BasÉ HidráUlica"  → "base hidraulica"
 */
export function normalizeMaterial(value: string): string {
  return value
    .normalize("NFD")                    // decompose accented chars: é → e + ́
    .replace(/[\u0300-\u036f]/g, "")     // strip combining diacritical marks
    .trim()
    .toLowerCase();
}
