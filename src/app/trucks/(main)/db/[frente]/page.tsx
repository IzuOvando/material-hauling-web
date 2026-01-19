import { getTickets } from "@/actions/tickets";
import { FrenteTrucksTools } from "@/components/frentes";
import { TableTicket } from "@/components/tickets";
import CONFIG from "@/config";
import prisma from "@/lib/db";
import { Section } from "@/types";
import { notFound } from "next/navigation";
import { requireFrenteAccess } from "@/auth/guards";

export default async function DBPage({
  params,
  searchParams,
}: {
  params: { frente: string; area: string };
  searchParams: {
    page?: string;
    limit?: string;
    sort?: string;
    filters?: string;
  };
}) {
  const user = await requireFrenteAccess(params.frente);

  const frentes =
    user.role === "owner"
      ? await prisma.frente.findMany()
      : await prisma.frente.findMany({
          where: { nombre: { in: user.frentes } },
        });

  const page = Number(searchParams.page) || CONFIG.PAGINATION.DEFAULT_PAGE;
  const limit = Number(searchParams.limit) || CONFIG.PAGINATION.DEFAULT_LIMIT;

  const response = await getTickets(
    params.frente,
    Section.VOUCHERCAMION,
    { page, limit },
    searchParams.sort,
    searchParams.filters
  );

  if (!response) notFound();

  return (
    <>
    <TableTicket
      tickets={response.tickets as any}
      frente={params.frente}
      area={Section.VOUCHERCAMION}
      page={page}
      limit={limit}
      total={response.total}
      componentTopLeft={
        <FrenteTrucksTools
          frentes={frentes}
          areTickets={response.tickets.length > 0}
        />
      }
    />
    </>
  );
}
