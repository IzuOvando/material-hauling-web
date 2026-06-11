import { FrenteTrucksTools } from "@/components/frentes";
import { TableTicket } from "@/components/tickets";
import CONFIG from "@/config";
import prisma from "@/lib/db";
import { Section } from "@/types";
import { requireAuth } from "@/auth/guards";

export default async function DBEmptyPage() {
  const user = await requireAuth();

  const frentes =
    user.role === "owner" || user.role === "general"
      ? await prisma.frente.findMany()
      : await prisma.frente.findMany({
          where: { nombre: { in: user.frentes } },
        });

  return (
    <>
    <TableTicket
      tickets={[]}
      area={Section.VOUCHERCAMION}
      page={CONFIG.PAGINATION.DEFAULT_PAGE}
      limit={CONFIG.PAGINATION.DEFAULT_LIMIT}
      total={0}
      componentTopLeft={<FrenteTrucksTools frentes={frentes} readOnly={user.role === "general"} isOwner={user.role === "owner"} />}
    />
    </>
  );
}
