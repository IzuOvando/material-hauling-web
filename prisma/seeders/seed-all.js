const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Inserting data into the database...");

  const users = [
    {
      username: "Ruben35",
      password: "$2b$12$7q16hkrm3xFKzjX.Zu6slOgZKjVaId4ygNwqxSPZ6xjcpsEASD1TW",
      rol: "owner",
    },
    {
      username: "IRG",
      password: "$2b$12$xovX9zyN0gUMvQCMwQoqd.MP6cAveN/XYVQI1zJRUBgiL1VCg8Du2",
      rol: "general",
    },
  ];

  for (const user of users) {
    try {
      await prisma.user.create({ data: user });
    } catch (e) {
      if (e.code === "P2002") {
        // User already exists, skip
      } else {
        throw e;
      }
    }
  }

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

  function normalizeMaterial(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  }

  for (const nombre of DEFAULT_MATERIALS) {
    const normalizedNombre = normalizeMaterial(nombre);
    await prisma.material.upsert({
      where: { nombre },
      update: { normalizedNombre },
      create: { nombre, normalizedNombre },
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
