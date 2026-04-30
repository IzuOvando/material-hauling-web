-- Migration: Replace voucherDate + voucherTime with a single voucherDatetime UTC timestamp

-- Step 1: Drop dependent view first (references voucherDate)
DROP VIEW IF EXISTS voucher_camion_powerbi;

-- Step 2: Add new column
ALTER TABLE "VoucherCamion" ADD COLUMN "voucherDatetime" TIMESTAMP(3);

-- Step 3: Backfill by combining the two existing columns.
-- voucherDate stores the local calendar date as local midnight in UTC
--   (e.g. 2026-04-01 Mexico City = 2026-04-01T06:00:00Z)
-- voucherTime stores the raw UTC hours anchored to 1970-01-01
--   (e.g. 1970-01-01T17:37:42Z means the voucher happened at 17:37:42 UTC)
-- Combining: take the UTC midnight of voucherDate + the UTC hour/min/sec of voucherTime
UPDATE "VoucherCamion"
SET "voucherDatetime" = (
  DATE_TRUNC('day', "voucherDate") +
  MAKE_INTERVAL(
    hours => EXTRACT(HOUR FROM "voucherTime")::int,
    mins  => EXTRACT(MINUTE FROM "voucherTime")::int,
    secs  => EXTRACT(SECOND FROM "voucherTime")
  )
);

-- Step 4: Make column NOT NULL (all rows should be backfilled)
ALTER TABLE "VoucherCamion" ALTER COLUMN "voucherDatetime" SET NOT NULL;

-- Step 5: Drop old indexes before dropping columns
DROP INDEX IF EXISTS "VoucherCamion_frenteNombre_voucherDate_idx";
DROP INDEX IF EXISTS "VoucherCamion_frenteNombre_voucherTime_idx";

-- Step 6: Drop old columns
ALTER TABLE "VoucherCamion" DROP COLUMN "voucherDate";
ALTER TABLE "VoucherCamion" DROP COLUMN "voucherTime";

-- Step 7: Create new index
CREATE INDEX "VoucherCamion_frenteNombre_voucherDatetime_idx"
  ON "VoucherCamion"("frenteNombre", "voucherDatetime");

-- Step 8: Recreate PowerBI view with voucherDatetime + computed local columns
CREATE VIEW voucher_camion_powerbi AS
SELECT
  folio,
  "voucherDatetime",
  ("voucherDatetime" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS "voucherLocalDate",
  ("voucherDatetime" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::time AS "voucherLocalTime",
  material,
  status::text,
  "odometerArrival",
  odometer,
  "arrivalTime",
  "noEconomico",
  cubicacion,
  "frenteNombre",
  "idCamion",
  latitude,
  longitude,
  "locationAccuracy",
  "locationTimestamp",
  "arrivalLatitude",
  "arrivalLongitude",
  "arrivalLocationAccuracy",
  "arrivalLocationTimestamp"
FROM "VoucherCamion";
