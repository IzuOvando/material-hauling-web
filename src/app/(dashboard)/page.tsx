import { TableTicket } from "@/components/tickets";
import { TicketArea } from "@/types";

export default async function Home() {
  return (
    <>
      <TableTicket tickets={[]} area={TicketArea.ACARREOS} />
    </>
  );
}
