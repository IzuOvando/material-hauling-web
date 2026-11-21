/**
 * Compares DashboardDailyMetrics with the real VoucherCamion rows and, with --apply,
 * rewrites only the days that differ. Same rules as src/lib/dashboardMetrics.ts:
 * CDMX day of voucherDatetime; totalVouchers = every voucher; trips/m³/turnos = ARRIVED only.
 *
 *   npm run metrics:rebuild               # diagnosis only, changes nothing
 *   npm run metrics:rebuild -- --apply    # fix the drifted days, then clear their dashboard cache
 *
 * Uses the local .env if present, otherwise the server's variables. Run --apply in a
 * quiet window: a voucher saved while it runs can be counted against a stale snapshot,
 * so run the diagnosis again afterwards and expect 0 days.
 */
const { PrismaClient, Prisma } = require("@prisma/client");
const { kv } = require("@vercel/kv");

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const LIVE = Prisma.sql`
  SELECT "frenteNombre",
         TO_CHAR(("voucherDatetime" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') AS date,
         COUNT(*)::int                                                   AS vouchers,
         COUNT(*) FILTER (WHERE status = 'ARRIVED')::int                 AS trips,
         COALESCE(SUM(cubicacion) FILTER (WHERE status = 'ARRIVED'), 0)  AS m3,
         COUNT(*) FILTER (WHERE status = 'ARRIVED' AND turno = 1)::int   AS turno1,
         COUNT(*) FILTER (WHERE status = 'ARRIVED' AND turno <> 1)::int  AS turno2
  FROM "VoucherCamion"
  GROUP BY 1, 2`;

const DRIFT = Prisma.sql`
  WITH live AS (${LIVE})
  SELECT COALESCE(l."frenteNombre", m."frenteNombre") AS "frenteNombre",
         COALESCE(l.date, m.date)                     AS date,
         COALESCE(m."totalVouchers", 0) AS "metricVouchers", COALESCE(l.vouchers, 0) AS "realVouchers",
         COALESCE(m."totalTrips", 0)    AS "metricTrips",    COALESCE(l.trips, 0)    AS "realTrips",
         COALESCE(m."totalM3", 0)       AS "metricM3",       COALESCE(l.m3, 0)       AS "realM3",
         COALESCE(m."turno1Arrived", 0) AS "metricT1",       COALESCE(l.turno1, 0)   AS "realT1",
         COALESCE(m."turno2Arrived", 0) AS "metricT2",       COALESCE(l.turno2, 0)   AS "realT2"
  FROM live l
  FULL OUTER JOIN "DashboardDailyMetrics" m ON m."frenteNombre" = l."frenteNombre" AND m.date = l.date
  WHERE COALESCE(m."totalVouchers", 0) <> COALESCE(l.vouchers, 0)
     OR COALESCE(m."totalTrips", 0)    <> COALESCE(l.trips, 0)
     OR ABS(COALESCE(m."totalM3", 0) - COALESCE(l.m3, 0)) > 0.001
     OR COALESCE(m."turno1Arrived", 0) <> COALESCE(l.turno1, 0)
     OR COALESCE(m."turno2Arrived", 0) <> COALESCE(l.turno2, 0)`;

async function findDrift(db) {
  const rows = await db.$queryRaw`${DRIFT} ORDER BY 1, 2`;
  return rows.map((r) => ({ ...r, metricM3: Number(r.metricM3), realM3: Number(r.realM3) }));
}

function printDrift(rows) {
  if (rows.length === 0) {
    console.log("Sin descuadres: DashboardDailyMetrics coincide con los vouchers.");
    return;
  }
  console.log(`${rows.length} día(s) descuadrados (métrica → real):`);
  console.table(
    rows.map((r) => ({
      frente: r.frenteNombre,
      dia: r.date,
      vouchers: `${r.metricVouchers} → ${r.realVouchers}`,
      viajes: `${r.metricTrips} → ${r.realTrips}`,
      m3: `${r.metricM3} → ${r.realM3}`,
      turno1: `${r.metricT1} → ${r.realT1}`,
      turno2: `${r.metricT2} → ${r.realT2}`,
    })),
  );
}

/** Upserts the real values for every drifted day in one statement; days with no vouchers become 0. */
async function fixDrift(tx) {
  return tx.$executeRaw`
    WITH drift AS (${DRIFT})
    INSERT INTO "DashboardDailyMetrics"
      ("frenteNombre", "date", "totalVouchers", "totalTrips", "totalM3", "turno1Arrived", "turno2Arrived", "updatedAt")
    SELECT "frenteNombre", date, "realVouchers", "realTrips", "realM3", "realT1", "realT2", NOW() FROM drift
    ON CONFLICT ("frenteNombre", "date") DO UPDATE
    SET "totalVouchers" = EXCLUDED."totalVouchers",
        "totalTrips"    = EXCLUDED."totalTrips",
        "totalM3"       = EXCLUDED."totalM3",
        "turno1Arrived" = EXCLUDED."turno1Arrived",
        "turno2Arrived" = EXCLUDED."turno2Arrived",
        "updatedAt"     = NOW()`;
}

async function clearDashboardCache(frente) {
  let cursor = 0;
  do {
    const [next, keys] = await kv.scan(cursor, { match: `dashboard:${frente}:*`, count: 1000 });
    if (keys.length > 0) await kv.del(...keys);
    cursor = Number(next);
  } while (cursor !== 0);
}

async function main() {
  const drift = await findDrift(prisma);
  printDrift(drift);
  if (drift.length === 0) return;

  if (!apply) {
    console.log("\nSolo diagnóstico, no se cambió nada. Para corregir: npm run metrics:rebuild -- --apply");
    return;
  }

  const fixed = await prisma.$transaction(fixDrift, { maxWait: 10_000, timeout: 60_000 });
  const frentes = [...new Set(drift.map((r) => r.frenteNombre))];
  for (const frente of frentes) await clearDashboardCache(frente);
  console.log(`\nCorregidos ${fixed} día(s) en ${frentes.length} frente(s); caché del dashboard limpiada.`);

  const remaining = await findDrift(prisma);
  console.log(
    remaining.length === 0
      ? "Verificación: 0 días descuadrados."
      : `Verificación: quedan ${remaining.length} día(s); probablemente hubo escrituras durante la corrección, vuelve a correrlo.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
