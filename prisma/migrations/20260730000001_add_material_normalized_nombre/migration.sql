-- Add normalizedNombre to Material for accent-insensitive catalog lookups
-- Populated from existing nombre values using the same normalization logic
-- (NFD decomposition, diacritic strip, trim, lowercase)
ALTER TABLE "Material" ADD COLUMN "normalizedNombre" TEXT;

-- Populate from existing records using unaccent (extension enabled in previous migration)
UPDATE "Material"
SET "normalizedNombre" = immutable_unaccent(LOWER(TRIM("nombre")));

-- Apply NOT NULL and UNIQUE constraints after population
ALTER TABLE "Material" ALTER COLUMN "normalizedNombre" SET NOT NULL;
CREATE UNIQUE INDEX "Material_normalizedNombre_key" ON "Material"("normalizedNombre");
