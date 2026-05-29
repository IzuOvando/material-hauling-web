import { requireFrenteAccess } from "@/auth/guards";
import { DashboardShell } from "@/components/trucks/dashboard/DashboardShell";

export default async function DashboardFrentePage({
  params,
}: {
  params: { frente: string };
}) {
  await requireFrenteAccess(params.frente);

  return <DashboardShell frente={params.frente} />;
}
