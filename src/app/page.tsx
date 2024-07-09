import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { PrintersAside } from "@/components";
import { TableTicket } from "@/components/tickets";
import { Navbar } from "@/components";

import FrenteActionButton from "@/components/upload/FrenteActionButton";
import prisma from "@/lib/db";
import FrentesButtons from "@/components/frentes/FrenteButtons";
import AddFrenteForm from "@/components/frentes/AddFrenteForm";
import RemoveFrenteForm from "@/components/frentes/DeleteFrente";

async function checkTicketsExist() {
  try {
    const count = await prisma.ticket.count();
    return count > 0;
  } catch (error) {
    console.error("Failed to check tickets:", error);
    return false;
  }
}

async function checkFrentesExist() {
  try {
    const frentes = await prisma.frente.findMany({
      include: {
        tickets: true,
      },
    });
    return frentes;
  } catch (error) {
    console.error("Failed to fetch frentes:", error);
    return [];
  }
}



export default async function Home() {

  const ticketsExists = await checkTicketsExist();
  const frentesExists = await checkFrentesExist();

  const tickets = ticketsExists ? await prisma.ticket.findMany() : [];

  return (
    <main className="container my-10">
      <section className="flex justify-center md:justify-between flex-wrap">
        <h1 className="text-4xl font-semibold block w-fit">Ticket Database</h1>
        <div className="flex gap-5 flex-wrap justify-center md:justify-end">
          {
            frentesExists.length !== 0 && (
              <FrenteActionButton frentes={frentesExists} />
            )
          }
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark">
                Ver Impresoras
              </Button>
            </SheetTrigger>
            <PrintersAside />
          </Sheet>
        </div>
      </section>
      <section>
        <FrentesButtons frentes={frentesExists} />
      </section>
      <section className="flex items-center mt-4">
        <AddFrenteForm />
        <RemoveFrenteForm frentes={frentesExists} />
      </section>
      <section className="mt-6">
        <TableTicket tickets={tickets} />
      </section>
    </main>
  );
}
