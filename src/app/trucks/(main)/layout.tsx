import { TabTrucks } from "@/components/trucks";

export default async function TrucksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="container my-10">
      <section className="flex justify-center md:justify-between flex-wrap md:flex-nowrap gap-3">
        <div className="flex items-center flex-wrap justify-center gap-4 md:justify-start">
          <h1 className="text-4xl font-semibold block w-fit text-center">
            Aplicación de Acarreos
          </h1>
        </div>
        <TabTrucks />
      </section>
      <section className="mt-6">{children}</section>
    </main>
  );
}
