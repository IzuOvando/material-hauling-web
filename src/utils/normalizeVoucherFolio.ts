const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalizes a single folio string to the raw format stored in the DB.
 *
 * Accepted inputs:
 *   - New format display  "D2F7-K7M3-P9F2"  → "D2F7K7M3P9F2"  (12 chars)
 *   - New format raw      "D2F7K7M3P9F2"    → "D2F7K7M3P9F2"  (12 chars)
 *   - Legacy UUID         "xxxxxxxx-xxxx-…"  → unchanged        (36 chars)
 *
 * Returns `valid: false` for anything else so the caller can surface the
 * error without stopping the rest of the batch.
 */
export function normalizeVoucherFolio(input: string): {
  raw: string;
  valid: boolean;
} {
  const trimmed = input.trim().toUpperCase();
  const withoutHyphens = trimmed.replace(/-/g, "");

  if (withoutHyphens.length === 12) {
    return { raw: withoutHyphens, valid: true };
  }

  if (trimmed.length === 36 && UUID_REGEX.test(trimmed)) {
    return { raw: trimmed.toLowerCase(), valid: true };
  }

  return { raw: trimmed, valid: false };
}

/**
 * Parses the raw textarea content into normalized folio strings.
 *
 * - Splits on newlines and commas
 * - Skips blank entries
 * - Deduplicates (keeps first occurrence)
 * - Separates valid from invalid format entries
 */
export function parseVoucherFolios(raw: string): {
  valid: string[];
  invalid: string[];
  duplicatesRemoved: number;
} {
  const tokens = raw
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const seen = new Set<string>();
  let duplicatesRemoved = 0;
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    const { raw: normalized, valid: isValid } = normalizeVoucherFolio(token);

    if (!isValid) {
      invalid.push(token);
      continue;
    }

    if (seen.has(normalized)) {
      duplicatesRemoved++;
      continue;
    }

    seen.add(normalized);
    valid.push(normalized);
  }

  return { valid, invalid, duplicatesRemoved };
}
