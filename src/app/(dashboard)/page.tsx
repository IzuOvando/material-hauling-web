import { TableTicket } from "@/components/tickets";
import { TicketArea } from "@/types";
import CONFIG from "@/config";
export default async function Home() {
  return (
    <>
      <TableTicket
        tickets={[]}
        area={TicketArea.ACARREOS}
        page={CONFIG.PAGINATION.DEFAULT_PAGE}
        limit={CONFIG.PAGINATION.DEFAULT_LIMIT}
        total={0}
      />
    </>
  );
}
