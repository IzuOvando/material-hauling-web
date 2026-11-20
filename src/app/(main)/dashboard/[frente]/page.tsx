import { requireFrenteAccess } from "@/auth/guards";
import { DashboardShell } from "@/components/trucks/dashboard/DashboardShell";
import { FrenteIdentityBadge } from "@/components/trucks/dashboard/FrenteIdentityBadge";
import { getProject } from "@/helpers/strings";
import prisma from "@/lib/db";

export default async function DashboardFrentePage({
  params,
}: {
  params: { frente: string };
}) {
  await requireFrenteAccess(params.frente);

  const frenteData = await prisma.frente.findUnique({
    where: { nombre: params.frente },
    select: { displayName: true, logoUrl: true },
  });

  // A frente without displayName takes the one of a sibling of the same project.
  // The dash in the prefix keeps project "AB" from matching "ABC-F1".
  let displayName = frenteData?.displayName ?? null;
  if (!displayName) {
    const sibling = await prisma.frente.findFirst({
      where: {
        nombre: { startsWith: `${getProject(params.frente)}-` },
        displayName: { not: null },
      },
      select: { displayName: true },
    });
    displayName = sibling?.displayName ?? null;
  }

  return (
    <div className="relative">
      <FrenteIdentityBadge
        frente={params.frente}
        displayName={displayName ?? undefined}
        logoUrl={frenteData?.logoUrl ?? undefined}
      />
      <DashboardShell frente={params.frente} />
    </div>
  );
}
