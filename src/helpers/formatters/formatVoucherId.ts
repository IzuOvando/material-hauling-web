/**
 * Formats the canonical VoucherCamion folio for display.
 *
 * New IDs (post SDN-106) are stored as 12 chars with no separators
 * (`{device4}{ts8}` in Crockford base32, e.g. `D2F7K7M3P9F2`). When
 * shown to the user, hyphens are inserted every 4 chars (`D2F7-K7M3-P9F2`).
 *
 * Legacy IDs (UUID v4, 36 chars) are returned unchanged to preserve visual
 * compatibility with historical vouchers.
 */
export const formatVoucherId = (raw: string): string => {
  if (raw.length !== 12) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
};
