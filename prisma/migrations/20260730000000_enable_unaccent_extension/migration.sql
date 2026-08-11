-- Enable unaccent extension for accent-insensitive text matching
-- This allows grouping material names that differ only in accents/diacritics
-- e.g. "Base Hidráulica" and "Basé Hidráulica" will be treated as the same material
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Functional index to support accent-insensitive WHERE clauses on material
-- without this, queries using unaccent(LOWER(TRIM(material))) would do a full table scan
-- Can be dropped once all data is normalized and queries switch back to exact matching
CREATE INDEX IF NOT EXISTS "VoucherCamion_frenteNombre_material_unaccent_idx"
  ON "VoucherCamion" ("frenteNombre", (unaccent(LOWER(TRIM(material)))));
