-- CreateTable
CREATE TABLE "DashboardDailyMetrics" (
    "frenteNombre" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "totalM3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "turno1Arrived" INTEGER NOT NULL DEFAULT 0,
    "turno2Arrived" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardDailyMetrics_pkey" PRIMARY KEY ("frenteNombre","date")
);

-- AddForeignKey
ALTER TABLE "DashboardDailyMetrics" ADD CONSTRAINT "DashboardDailyMetrics_frenteNombre_fkey" FOREIGN KEY ("frenteNombre") REFERENCES "Frente"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: populate DashboardDailyMetrics from existing ARRIVED vouchers.
-- Groups by frente and CDMX date (America/Mexico_City = UTC-6/UTC-5).
INSERT INTO "DashboardDailyMetrics"
  ("frenteNombre", "date", "totalTrips", "totalM3", "turno1Arrived", "turno2Arrived", "updatedAt")
SELECT
  "frenteNombre",
  TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') AS "date",
  COUNT(*)::int                                                    AS "totalTrips",
  COALESCE(SUM(cubicacion), 0)                                    AS "totalM3",
  SUM(CASE WHEN turno = 1 THEN 1 ELSE 0 END)::int                AS "turno1Arrived",
  SUM(CASE WHEN turno = 2 THEN 1 ELSE 0 END)::int                AS "turno2Arrived",
  NOW()                                                            AS "updatedAt"
FROM "VoucherCamion"
WHERE status = 'ARRIVED'::"VoucherStatus"
GROUP BY
  "frenteNombre",
  TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD')
ON CONFLICT ("frenteNombre", "date") DO UPDATE
  SET "totalTrips"    = EXCLUDED."totalTrips",
      "totalM3"       = EXCLUDED."totalM3",
      "turno1Arrived" = EXCLUDED."turno1Arrived",
      "turno2Arrived" = EXCLUDED."turno2Arrived",
      "updatedAt"     = NOW();
