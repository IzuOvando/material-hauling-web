import { redirect } from "next/navigation";
import { requireAuth } from "@/auth/guards";
import prisma from "@/lib/db";
import { MaterialsPage } from "@/components/materials/MaterialsPage";

export default async function MaterialsManagementPage() {
  const user = await requireAuth();

  if (user.role !== "owner") {
    redirect("/trucks/db");
  }

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <MaterialsPage frentes={frentes.map((f) => f.nombre)} />
  );
}
