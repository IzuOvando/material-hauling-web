/**
 * Derives a 3-character truck ID prefix from a client/app name.
 *
 * - 3+ words  → initials of the first 3 words (e.g. "SEDENA De Nacional" → "SDN")
 * - 1-2 words → first 3 characters of the name, uppercased
 * - Result is always padded/truncated to exactly 3 uppercase chars.
 *
 * This mirrors the same logic used in the mobile app.
 */
export function deriveTruckIdPrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  let raw: string;
  if (words.length >= 3) {
    raw = words.slice(0, 3).map((w) => w[0]).join("");
  } else {
    raw = words.join("").slice(0, 3);
  }

  return raw.toUpperCase().padEnd(3, "X");
}
