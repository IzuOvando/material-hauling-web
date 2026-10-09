/**
 * Seed the global OrigenCatalogo. Run once:
 *   node prisma/seeders/seed-origenes.js
 *
 * Optionally assign all origenes to every existing frente:
 *   node prisma/seeders/seed-origenes.js --assign
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_ORIGENES = [
  "Banco de Material",
  "Banco de Préstamo",
  "Préstamo Lateral",
  "Cantera",
  "Mina",
  "Planta",
  "Demolición",
  "Despalme",
  "Otro",
];

async function main() {
  const shouldAssign = process.argv.includes("--assign");

  console.log("Seeding global origen catalog...");

  const origenes = [];
  for (const nombre of DEFAULT_ORIGENES) {
    const origen = await prisma.origenCatalogo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    origenes.push(origen);
  }

  console.log(`Seeded ${origenes.length} origenes in catalog.`);

  if (shouldAssign) {
    const frentes = await prisma.frente.findMany();
    console.log(`Assigning origenes to ${frentes.length} existing frentes...`);

    for (const frente of frentes) {
      for (const origen of origenes) {
        await prisma.origenFrente.upsert({
          where: {
            frenteNombre_origenId: {
              frenteNombre: frente.nombre,
              origenId: origen.id,
            },
          },
          update: {},
          create: {
            frenteNombre: frente.nombre,
            origenId: origen.id,
          },
        });
      }
    }

    console.log("Assigned default origenes to all frentes.");
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
