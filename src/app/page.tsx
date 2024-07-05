import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { PrintersAside } from "@/components";
import { TableTicket } from "@/components/tickets";

import FileUpdate from "@/components/upload/UpdateInput";
import FileUpload from "@/components/upload/UploadInput";
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

export default async function Home() {
  const ticketsExists = await checkTicketsExist();
  const tickets = ticketsExists ? await prisma.ticket.findMany() : [];

  return (
    <main className="container my-10">
      <section className="flex justify-center md:justify-between flex-wrap">
        <h1 className="text-4xl font-semibold block w-fit">Ticket Database</h1>
        <div className="flex gap-5 flex-wrap justify-center md:justify-end">
          {!ticketsExists ? (
            <>
              <FileUpload />
            </>
          ) : (
            <>
              <FileUpdate />
            </>
          )}
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
      <section className="mt-6">
        <TableTicket tickets={tickets} />
      </section>
    </main>
  );
}
