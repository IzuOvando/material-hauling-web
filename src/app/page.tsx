import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { PrintersAside } from "@/components";
import { TableTicket } from "@/components/tickets";
import { FrenteTools } from "@/components/frentes";
import FrenteActionButton from "@/components/upload/FrenteActionButton";
import prisma from "@/lib/db";

async function checkTicketsExist() {
  try {
    const count = await prisma.ticket.count();
    return count > 0;
  } catch (error) {
    console.error("Failed to check tickets:", error);
    return false;
  }
}

async function getFrentes() {
  try {
    const frentes = await prisma.frente.findMany();
    return frentes;
  } catch (error) {
    console.error("Failed to fetch frentes:", error);
    return [];
  }
}

export default async function Home() {
  const ticketsExists = await checkTicketsExist();
  const frentes = await getFrentes();
  const tickets = ticketsExists ? await prisma.ticket.findMany() : [];

  return (
    <main className="container my-10">
      <section className="flex justify-center md:justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold block w-fit">
            Ticket Database
          </h1>
          <FrenteTools frentes={frentes} />
        </div>
        <div className="flex gap-5 flex-wrap justify-center md:justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                id="showPrinters"
                className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
              >
                Ver Impresoras
              </Button>
            </SheetTrigger>
            <PrintersAside />
          </Sheet>
        </div>
      </section>
      <section className="mt-6">
        <TableTicket tickets={tickets} />
      </section>
    </main>
  );
}
