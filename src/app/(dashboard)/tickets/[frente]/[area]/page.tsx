import { TableTicket } from "@/components/tickets";
import { notFound } from "next/navigation";
import { TicketArea } from "@/types";
import { getTickets } from "@/actions/tickets";
import CONFIG from "@/config";
import { requireFrenteAccess } from "@/auth/guards";

export default async function PageTickets({
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
  await requireFrenteAccess(params.frente);

  if (!Object.values(TicketArea).includes(params.area as TicketArea)) {
    notFound();
  }

  const page = Number(searchParams.page) || CONFIG.PAGINATION.DEFAULT_PAGE;
  const limit = Number(searchParams.limit) || CONFIG.PAGINATION.DEFAULT_LIMIT;

  const response = await getTickets(
    params.frente,
    params.area as TicketArea,
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
        area={params.area as TicketArea}
        total={response.total}
        page={page}
        limit={limit}
      />
    </>
  );
}
