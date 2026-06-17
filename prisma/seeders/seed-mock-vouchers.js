/* eslint-disable */
/**
 * Seeds realistic mock VoucherCamion rows for presentation/demo purposes.
 *
 * Mirrors how the mobile app produces vouchers:
 *  - folio in canonical `{device4}{ts8}` Crockford base32 format (12 chars)
 *  - material stored as plain catalog text
 *  - a mix of IN_TRANSIT / ARRIVED with arrival fields populated
 *
 * It also rebuilds DashboardDailyMetrics for the target frente so the landing
 * and dashboard KPIs reflect the seeded data.
 *
 * Usage:  node ./prisma/seeders/seed-mock-vouchers.js [FRENTE_NOMBRE]
 * Default frente: ABCD-F1
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TARGET_FRENTE = process.argv[2] || "ABCD-F1";
const TIMEZONE_OFFSET_HOURS = 6; // America/Mexico_City = UTC-6 (no DST)

// ---- Crockford base32 folio generation (matches mobile generateVoucherId) ----
const EPOCH_2024 = 1704067200000;
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DEVICE_PREFIXES = ["D2F7", "K7M3", "P9F2", "T4QX", "B8YH"];

function toCrockford(n, pad) {
  if (n === 0) return "0".repeat(pad);
  let remaining = BigInt(n);
  const base = BigInt(32);
  let out = "";
  while (remaining > 0n) {
    out = CROCKFORD_ALPHABET[Number(remaining % base)] + out;
    remaining = remaining / base;
  }
  return out.length > pad ? out.slice(-pad) : out.padStart(pad, "0");
}

let folioCounter = Math.floor((Date.now() - EPOCH_2024) / 100);
function makeFolio(i) {
  const prefix = DEVICE_PREFIXES[i % DEVICE_PREFIXES.length];
  folioCounter += 1 + Math.floor(Math.random() * 5);
  return `${prefix}${toCrockford(folioCounter, 8)}`;
}

// ---- Data pools ----
const MATERIALS = [
  "Terraplén",
  "Pedraplén",
  "Trancision",
  "Subrasante",
  "Subbalasto",
  "Balasto",
  "Base Hidráulica",
  "Grava",
  "Arena",
];
const OPERADORES = [
  ["Juan Pérez Ramírez", "OP1042"],
  ["Miguel Ángel Torres", "OP1187"],
  ["José Luis Hernández", "OP1255"],
  ["Carlos Mendoza Ruiz", "OP1320"],
  ["Roberto Sánchez Díaz", "OP1398"],
  ["Francisco Javier López", "OP1456"],
  ["Antonio Gutiérrez Mora", "OP1501"],
  ["Luis Alberto Castro", "OP1577"],
  ["Jorge Armando Ríos", "OP1634"],
  ["Pedro Vargas Núñez", "OP1689"],
  ["Raúl Domínguez Soto", "OP1722"],
  ["Sergio Aguilar Peña", "OP1810"],
];
const EMPRESAS = [
  "Constructora del Bajío S.A.",
  "Triturados y Agregados MX",
  "Transportes Pesados del Norte",
  "Materiales Pétreos SA de CV",
  "Grupo Constructor Ferroviario",
  "Acarreos y Logística TPC",
];
const ORIGENES = [
  "Banco San Miguel",
  "Banco El Cerrito",
  "Planta de Trituración Norte",
  "Banco Los Encinos",
  "Acopio Central Km 8",
];
const DESTINOS = [
  "Tramo 3+200",
  "Tramo 5+800",
  "Terraplén Km 12",
  "Frente 1 - Km 4+500",
  "Sub-estación Oriente",
  "Viaducto Pacífico",
];
const LOCALIDADES = ["Tlajomulco", "El Salto", "Zapopan", "Tlaquepaque", "Juanacatlán"];
const CHECKERS_SALIDA = [
  ["Ana López Martínez", "CK021"],
  ["Verónica Salazar", "CK034"],
  ["Diana Ramírez Cruz", "CK048"],
  ["Mario Estrada", "CK055"],
  ["Laura Jiménez", "CK063"],
];
const CHECKERS_LLEGADA = [
  ["Fernando Reyes", "CK101"],
  ["Patricia Núñez", "CK112"],
  ["Hugo Medina", "CK124"],
  ["Claudia Ortiz", "CK133"],
];
const CUBICACIONES = [7, 7, 12, 14, 14, 14, 16, 21];
const CREATED_BY = "Ruben35";

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makePlacas() {
  const L = "ABCDEFGHJKLMNPRSTUVWXYZ";
  return (
    rand(L.split("")) +
    rand(L.split("")) +
    randInt(1000, 9999) +
    rand(L.split(""))
  );
}

/** Build a UTC Date that falls on local `y-m-d` at local hour `h` (CDMX). */
function localDate(y, m, d, h, min) {
  return new Date(Date.UTC(y, m - 1, d, h + TIMEZONE_OFFSET_HOURS, min, 0));
}

function isoLocalDate(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ---- Build the day plan (mid-March 2026 → today 2026-06-10) ----
// Anchored to a fixed "today" so the demo lands on Ayer/Hoy/7 días/abril/mayo.
const TODAY = { y: 2026, m: 6, d: 10 };

function daysBetween(start, end) {
  const out = [];
  let cur = new Date(Date.UTC(start.y, start.m - 1, start.d));
  const last = new Date(Date.UTC(end.y, end.m - 1, end.d));
  while (cur <= last) {
    out.push({
      y: cur.getUTCFullYear(),
      m: cur.getUTCMonth() + 1,
      d: cur.getUTCDate(),
      dow: cur.getUTCDay(),
    });
    cur = new Date(cur.getTime() + 86400000);
  }
  return out;
}

function countForDay(day) {
  const isToday = day.y === TODAY.y && day.m === TODAY.m && day.d === TODAY.d;
  const isYesterday = day.y === 2026 && day.m === 6 && day.d === 9;
  if (isToday) return 6;
  if (isYesterday) return 13;
  if (day.dow === 0) return randInt(0, 1); // quiet Sundays
  // Within last 7 days → denser so "7 días" looks alive
  const ms =
    Date.UTC(TODAY.y, TODAY.m - 1, TODAY.d) -
    Date.UTC(day.y, day.m - 1, day.d);
  const daysAgo = ms / 86400000;
  if (daysAgo <= 7) return randInt(5, 9);
  return randInt(2, 6);
}

function statusForDay(daysAgo) {
  if (daysAgo === 0) return Math.random() < 0.7 ? "IN_TRANSIT" : "ARRIVED";
  if (daysAgo === 1) return Math.random() < 0.3 ? "IN_TRANSIT" : "ARRIVED";
  return Math.random() < 0.08 ? "IN_TRANSIT" : "ARRIVED";
}

async function main() {
  const frente = await prisma.frente.findUnique({ where: { nombre: TARGET_FRENTE } });
  if (!frente) {
    console.error(`❌ El frente "${TARGET_FRENTE}" no existe en la base de datos.`);
    process.exit(1);
  }

  console.log(`🧹 Limpiando vouchers existentes de "${TARGET_FRENTE}"…`);
  await prisma.voucherCamion.deleteMany({ where: { frenteNombre: TARGET_FRENTE } });
  await prisma.dashboardDailyMetrics.deleteMany({ where: { frenteNombre: TARGET_FRENTE } });

  const days = daysBetween({ y: 2026, m: 3, d: 16 }, TODAY);
  const rows = [];
  // date(local) → aggregates for DashboardDailyMetrics
  const metrics = new Map();

  let i = 0;
  for (const day of days) {
    const n = countForDay(day);
    const ms =
      Date.UTC(TODAY.y, TODAY.m - 1, TODAY.d) -
      Date.UTC(day.y, day.m - 1, day.d);
    const daysAgo = ms / 86400000;
    const dateKey = isoLocalDate(day.y, day.m, day.d);

    let m = metrics.get(dateKey) || {
      date: dateKey,
      totalVouchers: 0,
      totalTrips: 0,
      totalM3: 0,
      turno1Arrived: 0,
      turno2Arrived: 0,
    };

    for (let k = 0; k < n; k++) {
      const hour = randInt(6, 16);
      const minute = randInt(0, 59);
      const dt = localDate(day.y, day.m, day.d, hour, minute);
      const status = statusForDay(daysAgo);
      const turno = hour < 13 ? 1 : 2;
      const [operador, noEmpleado] = rand(OPERADORES);
      const [checkerName, checkerNo] = rand(CHECKERS_SALIDA);
      const cubicacion = rand(CUBICACIONES) + (Math.random() < 0.3 ? 0.5 : 0);
      const odometer = randInt(40000, 260000);

      const base = {
        folio: makeFolio(i++),
        voucherDatetime: dt,
        destino: rand(DESTINOS),
        origen: rand(ORIGENES),
        material: rand(MATERIALS),
        placas: makePlacas(),
        status,
        odometer,
        operador,
        turno,
        localidad: rand(LOCALIDADES),
        noEconomico: `EC-${randInt(1000, 1099)}`,
        empresa: rand(EMPRESAS),
        cubicacion,
        checkerName,
        noEmpleado,
        checkerNo,
        createdByUsername: CREATED_BY,
        frenteNombre: TARGET_FRENTE,
        idCamion: `SDN-${TARGET_FRENTE}-T${randInt(1, 25)}`,
        createdAt: dt,
      };

      m.totalVouchers += 1;

      if (status === "ARRIVED") {
        const [acName, acNo] = rand(CHECKERS_LLEGADA);
        base.arrivalTime = new Date(dt.getTime() + randInt(45, 300) * 60000);
        base.odometerArrival = odometer + randInt(5, 60);
        base.arrivalCheckerName = acName;
        base.arrivalCheckerEmployeeNumber = acNo;
        base.arrivalCreatedByUsername = CREATED_BY;

        m.totalTrips += 1;
        m.totalM3 += cubicacion;
        if (turno === 1) m.turno1Arrived += 1;
        else m.turno2Arrived += 1;
      }

      rows.push(base);
    }

    metrics.set(dateKey, m);
  }

  console.log(`📦 Insertando ${rows.length} vouchers…`);
  // Chunk inserts to stay well under any param limits.
  const CHUNK = 200;
  for (let c = 0; c < rows.length; c += CHUNK) {
    await prisma.voucherCamion.createMany({ data: rows.slice(c, c + CHUNK) });
  }

  console.log(`📊 Escribiendo ${metrics.size} días de métricas de dashboard…`);
  for (const m of metrics.values()) {
    await prisma.dashboardDailyMetrics.create({
      data: {
        frenteNombre: TARGET_FRENTE,
        date: m.date,
        totalVouchers: m.totalVouchers,
        totalTrips: m.totalTrips,
        totalM3: Math.round(m.totalM3 * 100) / 100,
        turno1Arrived: m.turno1Arrived,
        turno2Arrived: m.turno2Arrived,
      },
    });
  }

  const arrived = rows.filter((r) => r.status === "ARRIVED").length;
  console.log("✅ Listo.");
  console.log(`   Frente:        ${TARGET_FRENTE}`);
  console.log(`   Total:         ${rows.length}`);
  console.log(`   Llegó:         ${arrived}`);
  console.log(`   En tránsito:   ${rows.length - arrived}`);
  console.log(`   Rango fechas:  ${rows[0].voucherDatetime.toISOString().slice(0, 10)} → ${TODAY.y}-0${TODAY.m}-${TODAY.d}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
