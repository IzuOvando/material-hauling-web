const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


async function clearAllData() {
    try {
        await prisma.gasolina.deleteMany({});
        await prisma.acarreos.deleteMany({});
        await prisma.frente.deleteMany({});

        console.log('Todos los registros han sido eliminados.');
    } catch (error) {
        console.error('Error al eliminar los registros:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearAllData();
