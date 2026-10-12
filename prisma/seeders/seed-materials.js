/**
 * Standalone script to seed the global material catalog in production.
 * Run once: node prisma/seed-materials.js
 *
 * Optionally assign default materials to all existing frentes
 * by passing --assign flag: node prisma/seed-materials.js --assign
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_MATERIALS = [
  "Terraplen",
  "Pedraplén",
  "Trancision",
  "Subrasante",
  "Subbalasto",
  "Balasto",
  "Asfalto",
  "Grava",
  "Arena",
  "Base Hidráulica",
];

function normalizeMaterial(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function main() {
  const shouldAssign = process.argv.includes("--assign");

  console.log("Seeding global material catalog...");

  const materials = [];
  for (const nombre of DEFAULT_MATERIALS) {
    const normalizedNombre = normalizeMaterial(nombre);
    const material = await prisma.material.upsert({
      where: { normalizedNombre },
      update: {},
      create: { nombre, normalizedNombre },
    });
    materials.push(material);
  }

  console.log(`Seeded ${materials.length} materials in catalog.`);

  if (shouldAssign) {
    const frentes = await prisma.frente.findMany();
    console.log(`Assigning materials to ${frentes.length} existing frentes...`);

    for (const frente of frentes) {
      for (const material of materials) {
        await prisma.materialFrente.upsert({
          where: {
            materialId_frenteNombre: {
              materialId: material.id,
              frenteNombre: frente.nombre,
            },
          },
          update: {},
          create: {
            materialId: material.id,
            frenteNombre: frente.nombre,
          },
        });
      }
    }

    console.log("Assigned default materials to all frentes.");
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
