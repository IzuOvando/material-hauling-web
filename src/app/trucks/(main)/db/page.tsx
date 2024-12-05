import { FrenteTrucksTools } from "@/components/frentes";
import { TableTicket } from "@/components/tickets";
import CONFIG from "@/config";
import prisma from "@/lib/db";
import { Section } from "@/types";

export default async function DBEmptyPage() {
  const frentes = await prisma.frente.findMany();

  return (
    <>
      <TableTicket
        tickets={[]}
        area={Section.VOUCHERCAMION}
        page={CONFIG.PAGINATION.DEFAULT_PAGE}
        limit={CONFIG.PAGINATION.DEFAULT_LIMIT}
        total={0}
        componentTopLeft={<FrenteTrucksTools frentes={frentes} />}
      />
    </>
  );
}
