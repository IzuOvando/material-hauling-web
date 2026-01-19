import prisma from "@/lib/db";
import { auth } from "@/auth";
import type { AppUser } from "@/types/auth";
import type { Role } from "@/types/roles";

export async function getAppUser(): Promise<AppUser | null> {
  const session = await auth();
  if (!session?.user?.name) return null;

  const user = await prisma.user.findUnique({
    where: { username: session.user.name },
    include: {
      frentes: {
        select: { frenteNombre: true },
      },
    },
  });

  if (!user) return null;

  return {
    name: user.username,
    role: user.rol as Role,
    frentes: user.frentes.map(f => f.frenteNombre),
  };
}
