-- Enable unaccent extension for accent-insensitive text matching
-- This allows grouping material names that differ only in accents/diacritics
-- e.g. "Base Hidráulica" and "Basé Hidráulica" will be treated as the same material
CREATE EXTENSION IF NOT EXISTS unaccent;

-- PostgreSQL requires IMMUTABLE functions for index expressions.
-- unaccent() is STABLE by default, so we wrap it in an IMMUTABLE function.
-- This is safe because unaccent with a fixed dictionary always returns the same
-- output for the same input.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$
  SELECT unaccent($1)
$$;

-- Functional index using the immutable wrapper to support accent-insensitive
-- WHERE clauses on material without full table scans.
-- Can be dropped once all data is normalized and queries switch back to exact matching.
CREATE INDEX IF NOT EXISTS "VoucherCamion_frenteNombre_material_unaccent_idx"
  ON "VoucherCamion" ("frenteNombre", (immutable_unaccent(LOWER(TRIM(material)))));
