import { TableTicket } from "@/components/tickets";
import { notFound } from "next/navigation";
import { TicketArea } from "@/types";
import prisma from "@/lib/db";

async function getTickets(frenteName: string, area: string) {
  if (![TicketArea.ACARREOS, TicketArea.GASOLINA].includes(area as TicketArea))
    return null;

  const frente = await prisma.frente.findUnique({
    where: { nombre: frenteName },
    include: { ticketsGasolina: true, ticketsAcarreos: true },
  });

  if (!frente) return null;

  const tickets =
    area === TicketArea.ACARREOS
      ? frente.ticketsAcarreos
      : frente.ticketsGasolina;

  return tickets;
}

export default async function PageTickets({
  params,
}: {
  params: { frente: string; area: string };
}) {
  const tickets: any = await getTickets(params.frente, params.area);

  if (!tickets) {
    return notFound();
  }

  return (
    <>
      <TableTicket tickets={tickets} area={params.area as TicketArea} />
    </>
  );
}
