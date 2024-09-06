import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { PrintersAside } from "@/components";
import { FrenteTools } from "@/components/frentes";
import prisma from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const frentes = await prisma.frente.findMany();

  return (
    <main className="container my-10">
      <section className="flex justify-center md:justify-between flex-wrap md:flex-nowrap gap-3">
        <div className="flex items-center flex-wrap justify-center gap-4 md:justify-start">
          <h1 className="text-4xl font-semibold block w-fit text-center">
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
      <section className="mt-6">{children}</section>
    </main>
  );
}
