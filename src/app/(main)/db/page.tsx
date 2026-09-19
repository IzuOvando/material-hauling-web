import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireAuth } from "@/auth/guards";
import { FrenteSelector, type FrenteKpiSnapshot } from "@/components/trucks";
import whiteLabelConfig from "../../../../white-label.config";

function getTodayCDMX(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Mexico_City",
  });
}

export default async function DBEmptyPage() {
  const user = await requireAuth();

  const frentes =
    user.role === "owner" || user.role === "general"
      ? await prisma.frente.findMany({ orderBy: { nombre: "asc" } })
      : await prisma.frente.findMany({
          where: { nombre: { in: user.frentes } },
          orderBy: { nombre: "asc" },
        });

  if (user.role === "admin" && frentes.length === 1) {
    redirect(`/db/${frentes[0].nombre}`);
  }

  const todayRows = await prisma.dashboardDailyMetrics.findMany({
    where: { date: getTodayCDMX() },
    select: {
      frenteNombre: true,
      totalTrips: true,
      totalM3: true,
      turno1Arrived: true,
      turno2Arrived: true,
    },
  });

  const todayMetrics: Record<string, FrenteKpiSnapshot> = Object.fromEntries(
    todayRows.map((r) => [r.frenteNombre, r])
  );

  return (
    <FrenteSelector
      frentes={frentes}
      todayMetrics={todayMetrics}
      basePath="/db"
      title={(whiteLabelConfig as any)?.ui?.frenteSelector?.title ?? "Selecciona un frente"}
      subtitle={(whiteLabelConfig as any)?.ui?.frenteSelector?.subtitle ?? "Elige el frente para ver y filtrar sus vouchers"}
      ctaLabel={(whiteLabelConfig as any)?.ui?.frenteSelector?.ctaLabel ?? "Ver vouchers"}
    />
  );
}
