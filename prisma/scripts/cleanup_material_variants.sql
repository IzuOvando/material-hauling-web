-- =============================================================================
-- Material Name Cleanup Script (SDN-169)
-- =============================================================================
-- PURPOSE:
--   Unifies VoucherCamion.material variants that differ only in accents, casing,
--   or whitespace (e.g. 'Base Hidráulica', 'Basé Hidráulica', 'BasÉ HidráUlica').
--
-- WHEN TO RUN:
--   AFTER deploying SDN-169 (the unaccent extension must exist in the DB first).
--   Run repeatedly while the old mobile app version is still in the field sending
--   unnormalized data. Stop when STEP 1 returns zero rows.
--
-- SAFE TO RUN MULTIPLE TIMES: Yes — idempotent by design.
--
-- HOW TO RUN:
--   psql $POSTGRES_URL_NON_POOLING -f prisma/scripts/cleanup_material_variants.sql
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1 — AUDIT: show all dirty variant groups
--
-- Output columns:
--   normalized_key  → the key all variants collapse to
--   variants        → array of distinct raw values found in the DB
--   total_vouchers  → how many vouchers are affected across all variants
--   needs_catalog   → TRUE if none of the variants match the Material catalog
--                     (means the most frequent variant will be used as canonical)
-- -----------------------------------------------------------------------------
SELECT
  immutable_unaccent(LOWER(TRIM(material)))                    AS normalized_key,
  array_agg(DISTINCT material ORDER BY material)     AS variants,
  COUNT(*)                                           AS total_vouchers,
  NOT EXISTS (
    SELECT 1 FROM "Material" m
    WHERE immutable_unaccent(LOWER(TRIM(m."nombre"))) = immutable_unaccent(LOWER(TRIM(material)))
  )                                                  AS needs_catalog
FROM "VoucherCamion"
GROUP BY immutable_unaccent(LOWER(TRIM(material)))
HAVING COUNT(DISTINCT material) > 1
ORDER BY total_vouchers DESC;


-- -----------------------------------------------------------------------------
-- STEP 2 — PREVIEW: show exactly what will change (no writes yet)
--
-- Output columns:
--   folio           → voucher identifier
--   current_value   → what is stored right now
--   will_be_set_to  → what the cleanup will write
--   source          → "catalog" if resolved from Material table, "most_frequent" otherwise
-- -----------------------------------------------------------------------------
SELECT
  vc.folio,
  vc.material                                                AS current_value,
  COALESCE(
    (SELECT m."nombre" FROM "Material" m
     WHERE immutable_unaccent(LOWER(TRIM(m."nombre"))) = immutable_unaccent(LOWER(TRIM(vc.material)))
     LIMIT 1),
    (SELECT material FROM "VoucherCamion"
     WHERE immutable_unaccent(LOWER(TRIM(material))) = immutable_unaccent(LOWER(TRIM(vc.material)))
     GROUP BY material ORDER BY COUNT(*) DESC LIMIT 1)
  )                                                          AS will_be_set_to,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM "Material" m
      WHERE immutable_unaccent(LOWER(TRIM(m."nombre"))) = immutable_unaccent(LOWER(TRIM(vc.material)))
    ) THEN 'catalog'
    ELSE 'most_frequent'
  END                                                        AS source
FROM "VoucherCamion" vc
WHERE material != COALESCE(
  (SELECT m."nombre" FROM "Material" m
   WHERE immutable_unaccent(LOWER(TRIM(m."nombre"))) = immutable_unaccent(LOWER(TRIM(vc.material)))
   LIMIT 1),
  (SELECT material FROM "VoucherCamion"
   WHERE immutable_unaccent(LOWER(TRIM(material))) = immutable_unaccent(LOWER(TRIM(vc.material)))
   GROUP BY material ORDER BY COUNT(*) DESC LIMIT 1)
)
ORDER BY will_be_set_to, current_value;


-- -----------------------------------------------------------------------------
-- STEP 3 — CLEANUP: apply the unification
--
-- After this runs, psql will print:  UPDATE N
-- where N is the number of rows updated. If N = 0, no dirty data was found.
-- -----------------------------------------------------------------------------
UPDATE "VoucherCamion" vc
SET material = COALESCE(
  (SELECT m."nombre" FROM "Material" m
   WHERE immutable_unaccent(LOWER(TRIM(m."nombre"))) = immutable_unaccent(LOWER(TRIM(vc.material)))
   LIMIT 1),
  (SELECT material FROM "VoucherCamion"
   WHERE immutable_unaccent(LOWER(TRIM(material))) = immutable_unaccent(LOWER(TRIM(vc.material)))
   GROUP BY material ORDER BY COUNT(*) DESC LIMIT 1)
)
WHERE material != COALESCE(
  (SELECT m."nombre" FROM "Material" m
   WHERE immutable_unaccent(LOWER(TRIM(m."nombre"))) = immutable_unaccent(LOWER(TRIM(vc.material)))
   LIMIT 1),
  (SELECT material FROM "VoucherCamion"
   WHERE immutable_unaccent(LOWER(TRIM(material))) = immutable_unaccent(LOWER(TRIM(vc.material)))
   GROUP BY material ORDER BY COUNT(*) DESC LIMIT 1)
);


-- -----------------------------------------------------------------------------
-- STEP 4 — VERIFY: confirm no dirty groups remain
--
-- Expected output when clean: zero rows returned.
-- If rows still appear, there are variants the catalog doesn't cover —
-- review the "needs_catalog = TRUE" rows from STEP 1 and add them to
-- the Material catalog if needed, then re-run.
-- -----------------------------------------------------------------------------
SELECT
  immutable_unaccent(LOWER(TRIM(material)))                    AS normalized_key,
  array_agg(DISTINCT material ORDER BY material)     AS remaining_variants,
  COUNT(*)                                           AS total_vouchers
FROM "VoucherCamion"
GROUP BY immutable_unaccent(LOWER(TRIM(material)))
HAVING COUNT(DISTINCT material) > 1
ORDER BY total_vouchers DESC;
