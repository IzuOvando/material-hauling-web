/**
 * Seed the global TiroCatalogo. Run once:
 *   node prisma/seeders/seed-tiros.js
 *
 * Optionally assign all tiros to every existing frente:
 *   node prisma/seeders/seed-tiros.js --assign
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_TIROS = [
  "Banco de Tiro",
  "Centro de Acopio",
  "Centro de Reciclaje",
];

async function main() {
  const shouldAssign = process.argv.includes("--assign");

  console.log("Seeding global tiro catalog...");

  const tiros = [];
  for (const nombre of DEFAULT_TIROS) {
    const tiro = await prisma.tiroCatalogo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    tiros.push(tiro);
  }

  console.log(`Seeded ${tiros.length} tiros in catalog.`);

  if (shouldAssign) {
    const frentes = await prisma.frente.findMany();
    console.log(`Assigning tiros to ${frentes.length} existing frentes...`);

    for (const frente of frentes) {
      for (const tiro of tiros) {
        await prisma.tiroFrente.upsert({
          where: {
            frenteNombre_tiroId: {
              frenteNombre: frente.nombre,
              tiroId: tiro.id,
            },
          },
          update: {},
          create: {
            frenteNombre: frente.nombre,
            tiroId: tiro.id,
          },
        });
      }
    }

    console.log("Assigned default tiros to all frentes.");
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
