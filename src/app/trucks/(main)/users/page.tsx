import { requireOwnerAccess } from "@/auth/guards";
import prisma from "@/lib/db";
import { UsersTable } from "@/components/users/UsersTable";

export default async function UsersManagementPage() {
  await requireOwnerAccess();

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Gestionar Usuarios</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Administra los usuarios del sistema: edita perfiles, asigna frentes y controla el acceso.
        </p>
      </div>
      <UsersTable frentes={frentes.map((f) => f.nombre)} />
    </div>
  );
}
