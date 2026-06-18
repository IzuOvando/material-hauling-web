import { TrucksNav } from "@/components/trucks";
import { TrucksLayoutClient } from "./TrucksLayoutClient";
import { requireAuth } from "@/auth/guards";

export default async function TrucksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <main className="container my-10">
      <h1 className="text-4xl font-semibold mb-8">Aplicación de Acarreos</h1>
      <TrucksLayoutClient nav={<TrucksNav userRole={user.role} />}>
        {children}
      </TrucksLayoutClient>
    </main>
  );
}
