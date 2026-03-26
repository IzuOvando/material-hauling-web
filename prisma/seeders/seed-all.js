const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Inserting data into the database...");
  await prisma.user.create({
    data: {
      username: "Ruben35",
      password: "$2b$12$7q16hkrm3xFKzjX.Zu6slOgZKjVaId4ygNwqxSPZ6xjcpsEASD1TW",
      rol: "admin",
    },
  });

  await prisma.user.create({
    data: {
      username: "JuanOvando",
      password: "$2b$12$yjxMT3h3lDupY2i8NfeqBuPNPAZdTSEWMGboZiyhmrCVag/gFoKyi",
      rol: "owner",
    },
  });

  await prisma.user.create({
    data: {
      username: "MiguelPorras",
      password: "$2b$12$tDDuSVCMAgmADhpu7.QOeOVTfr2XMF43Hw/OgUcroS6V84Fu6/shS",
      rol: "user",
    },
  });

  console.log("Succesfully inserted users into the database!");

  // Seed global material catalog
  const DEFAULT_MATERIALS = [
    "Terraplén",
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

  for (const nombre of DEFAULT_MATERIALS) {
    await prisma.material.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log("Succesfully inserted materials into the database!");
}

main()
  .catch((e) => {
    if (e.code === "P2002") {
      console.log("The data already exists, skipping creation");
      process.exit(0);
    }
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
