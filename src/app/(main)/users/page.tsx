import { requireOwnerAccess } from "@/auth/guards";
import prisma from "@/lib/db";
import { UsersTable } from "@/components/users/UsersTable";

import whiteLabelConfig from "#/white-label.config";

export default async function UsersManagementPage() {
  await requireOwnerAccess();

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          {(whiteLabelConfig as any)?.ui?.pageTitles?.usersManagement || "Gestionar Usuarios"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {(whiteLabelConfig as any)?.ui?.pageTitles?.usersManagementDescription || "Administra los usuarios del sistema: edita perfiles, asigna frentes y controla el acceso."}
        </p>
      </div>
      <UsersTable frentes={frentes.map((f) => f.nombre)} />
    </div>
  );
}
