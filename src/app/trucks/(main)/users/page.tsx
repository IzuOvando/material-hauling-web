import { requireOwnerAccess } from "@/auth/guards";
import prisma from "@/lib/db";
import { CreateUserForm } from "@/components/users/CreateUserForm";

export default async function UsersManagementPage() {
  await requireOwnerAccess();

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <CreateUserForm frentes={frentes.map((f) => f.nombre)} />
  );
}
