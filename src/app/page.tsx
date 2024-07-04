import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { PrintersAside } from "@/components";
import FileUpdate from "@/components/upload/UpdateInput"
import FileUpload from "@/components/upload/UploadInput"
import prisma from "@/lib/db";

async function checkTicketsExist() {
  try {
    const count = await prisma.ticket.count();
    return count > 0;
  } catch (error) {
    console.error("Failed to check tickets:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function handler() {
  const ticketsExist = await checkTicketsExist();
  return ticketsExist
}

export default async function Home() {
  const showButtons = await handler()
  return (
    <main className="container mt-10">
      <h1 className="text-4xl font-semibold">Ticket Database</h1>
      <div className="mt-10 mb-3">
        <h4 className="text-gray-700 text-lg font-semibold">Impresoras</h4>
        <div className="border-b border-gray-300"></div>
      </div>
      <div className="flex w-full gap-4 justify-end">
        {!showButtons ? (
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
      <div className="mt- mb-3">
        <h4 className="text-gray-700 text-lg font-semibold">Datos</h4>
        <div className="border-b border-gray-300"></div>
      </div>
      <div className="block">
        {!showButtons ? (
          <>
            <h3>Filtros</h3>
          </>
        ) : (
          <>
            <h3>Filtros</h3>
            <div className="block gap-4 justify-start mx-4 my-2">
              {/* <FilterDropdown /> */}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
