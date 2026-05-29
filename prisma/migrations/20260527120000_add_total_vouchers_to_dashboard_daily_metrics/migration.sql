-- Add totalVouchers column: tracks ALL dispatched vouchers (ARRIVED + IN_TRANSIT).
-- Incremented on voucher creation; not touched by the arrival update path.
ALTER TABLE "DashboardDailyMetrics" ADD COLUMN "totalVouchers" INTEGER NOT NULL DEFAULT 0;

-- Backfill: count every VoucherCamion row (any status) grouped by frente + CDMX date.
-- Inserts rows for days that only had IN_TRANSIT vouchers (not present before).
-- On conflict (days that already had ARRIVED rows), only updates totalVouchers.
INSERT INTO "DashboardDailyMetrics"
  ("frenteNombre", "date", "totalTrips", "totalM3", "turno1Arrived", "turno2Arrived", "totalVouchers", "updatedAt")
SELECT
  "frenteNombre",
  TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') AS "date",
  0 AS "totalTrips",
  0 AS "totalM3",
  0 AS "turno1Arrived",
  0 AS "turno2Arrived",
  COUNT(*)::int AS "totalVouchers",
  NOW() AS "updatedAt"
FROM "VoucherCamion"
GROUP BY
  "frenteNombre",
  TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD')
ON CONFLICT ("frenteNombre", "date") DO UPDATE
  SET "totalVouchers" = EXCLUDED."totalVouchers",
      "updatedAt"     = NOW();
