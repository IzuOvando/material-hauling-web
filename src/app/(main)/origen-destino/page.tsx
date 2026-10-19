import { redirect } from "next/navigation";
import { requireAuth } from "@/auth/guards";
import prisma from "@/lib/db";
import { OrigenDestinoPage } from "@/components/origen-destino/OrigenDestinoPage";

export default async function OrigenDestinoManagementPage() {
  const user = await requireAuth();

  if (user.role !== "owner") {
    redirect("/db");
  }

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <OrigenDestinoPage frentes={frentes.map((f) => f.nombre)} />
  );
}
