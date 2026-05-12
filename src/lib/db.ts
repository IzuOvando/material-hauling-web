import { PrismaClient, Prisma } from "@prisma/client";

const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

function isConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1008", "P1017"].includes(error.code);
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const prismaClientSingleton = () => {
  const client = new PrismaClient();

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          let lastError: unknown;
          for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              lastError = error;
              if (attempt < RETRY_COUNT && isConnectionError(error)) {
                await sleep(RETRY_DELAY_MS);
              } else {
                throw error;
              }
            }
          }
          throw lastError;
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare const globalThis: {
  prismaGlobal: PrismaClientSingleton;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
