import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { PrintersAside } from "@/components";
import { FrenteTools } from "@/components/frentes";
import prisma from "@/lib/db";
import { requireDashboardAccess } from "@/auth/guards";
import { Frente } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireDashboardAccess();
  let frentes: Frente[] = [];

  if (user?.role === "owner") {
    frentes = await prisma.frente.findMany();
  }

  if (user?.role === "admin") {
    frentes = await prisma.frente.findMany({
      where: {
        nombre: {
          in: user?.frentes,
        },
      },
    });
  }

  return (
    <main className="container my-10">
      <section className="flex justify-center md:justify-between flex-wrap md:flex-nowrap gap-3">
        <div className="flex items-center flex-wrap justify-center gap-4 md:justify-start">
          <h1 className="text-4xl font-semibold block w-fit text-center">
            Base de Datos de Vouchers
          </h1>
          <FrenteTools frentes={frentes} role={user.role} />
        </div>
        {(user.role === "owner" || user.role === "admin") && (
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
        )}
      </section>
      <section className="mt-6">{children}</section>
    </main>
  );
}
