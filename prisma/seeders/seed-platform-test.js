/**
 * Platform test seed — creates a minimal dataset for smoke-testing the
 * material-hauling-platform (white-label) deployment.
 *
 * Run against a specific database:
 *   DATABASE_URL="..." node prisma/seeders/seed-platform-test.js
 *
 * Or with the Vercel env file:
 *   node --env-file=.env.platform prisma/seeders/seed-platform-test.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const TEST_FRENTE = "Frente-Test-01";

const USERS = [
  {
    username: "admin",
    // password: Admin123
    password: "$2b$12$oc4gAoIPo/tafw.PS5A4A.rmf5ugxMT9kOnHpZLmduh7mjSMMDqQu",
    rol: "owner",
    nombre: "Admin",
    apPaterno: "Test",
  },
  {
    username: "supervisor",
    // password: Admin123
    password: "$2b$12$oc4gAoIPo/tafw.PS5A4A.rmf5ugxMT9kOnHpZLmduh7mjSMMDqQu",
    rol: "general",
    nombre: "Supervisor",
    apPaterno: "Test",
  },
];

const MATERIALS = [
  "Terraplén", "Pedraplén", "Transición", "Subrasante",
  "Subbalasto", "Balasto", "Asfalto", "Grava", "Arena", "Base Hidráulica",
];

/** Strip accents, trim, lowercase — mirrors src/utils/normalizeMaterial.ts */
function normalizeMaterial(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function main() {
  console.log("Seeding platform test data...\n");

  // 1 — Frente
  await prisma.frente.upsert({
    where: { nombre: TEST_FRENTE },
    update: {},
    create: { nombre: TEST_FRENTE, frenteKey: "FRENTE-TEST-01", displayName: "Frente de prueba 01" },
  });
  console.log(`✓ Frente: ${TEST_FRENTE}`);

  // 2 — Users
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
    console.log(`✓ User: ${user.username} (${user.rol}) — password: Admin123`);
  }

  // 3 — Link users to frente
  for (const user of USERS) {
    await prisma.userFrente.upsert({
      where: { userId_frenteNombre: { userId: user.username, frenteNombre: TEST_FRENTE } },
      update: {},
      create: { userId: user.username, frenteNombre: TEST_FRENTE },
    });
  }
  console.log(`✓ Users linked to ${TEST_FRENTE}`);

  // 4 — Global material catalog
  for (const nombre of MATERIALS) {
    await prisma.material.upsert({
      where: { nombre },
      update: {},
      create: { nombre, normalizedNombre: normalizeMaterial(nombre) },
    });
  }
  console.log(`✓ ${MATERIALS.length} materials`);

  // 5 — Link materials to frente (look up by nombre to get the UUID id)
  const materialRecords = await prisma.material.findMany({ where: { nombre: { in: MATERIALS } } });
  for (const mat of materialRecords) {
    await prisma.materialFrente.upsert({
      where: { materialId_frenteNombre: { materialId: mat.id, frenteNombre: TEST_FRENTE } },
      update: {},
      create: { materialId: mat.id, frenteNombre: TEST_FRENTE },
    });
  }
  console.log(`✓ ${materialRecords.length} materials linked to ${TEST_FRENTE}`);

  console.log("\nDone. Test credentials:");
  console.log("  username: admin      password: Admin123  role: owner");
  console.log("  username: supervisor  password: Admin123  role: general");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
