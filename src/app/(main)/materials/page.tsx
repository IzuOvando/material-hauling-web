import { redirect } from "next/navigation";
import { requireAuth } from "@/auth/guards";
import prisma from "@/lib/db";
import { MaterialsPage } from "@/components/materials/MaterialsPage";
import { getUncatalogedMaterials } from "@/actions/materials";

export default async function MaterialsManagementPage() {
  const user = await requireAuth();

  if (user.role !== "owner") {
    redirect("/db");
  }

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  const uncataloged = await getUncatalogedMaterials();

  return (
    <MaterialsPage frentes={frentes.map((f) => f.nombre)} uncataloged={uncataloged} />
  );
}
