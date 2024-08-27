const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Inserting data into the database...");
  await prisma.user.create({
    data: {
      username: "Ruben35",
      password:
        "441a0e91023c4658951e9ec6a3343b1639cd98d520aa5c8e2c84b0d64152a133",
      rol: "admin",
    },
  });

  await prisma.user.create({
    data: {
      username: "JuanOvando",
      password:
        "d76b823f60f2c47f8117792a4ab439f879c30873ba56ce103de7c923418d76ad",
      rol: "admin",
    },
  });

  await prisma.user.create({
    data: {
      username: "MiguelPorras",
      password:
        "2518b30d074866418e68f8ac3110ebec7226af2cdcaab6da94495a6776c1f539",
      rol: "user",
    },
  });

  await prisma.user.create({
    data: {
      username: "JannesLopez",
      password:
        "44dc459d9b87882f9e20603cd3b3e8ca03149f338a5c206e5c4a441f1cfcf7d5",
      rol: "user",
    },
  });

  await prisma.user.create({
    data: {
      username: "CristinoEspitia",
      password:
        "d456a0190618aa4e26d15b76ca9abc80a0ea873a72d48de7d5adda45e225e3af",
      rol: "user",
    },
  });

  console.log("Succesfully inserted users into the database!");
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
