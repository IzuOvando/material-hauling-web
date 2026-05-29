import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireDashboardAccess } from "@/auth/guards";
import { DashboardFrenteSelector } from "@/components/trucks/dashboard/DashboardFrenteSelector";
import type { FrenteKpiSnapshot } from "@/components/trucks/dashboard/DashboardFrenteSelector";

function getTodayCDMX(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Mexico_City",
  });
}

export default async function DashboardPage() {
  const user = await requireDashboardAccess();

  const frentes =
    user.role === "owner" || user.role === "general"
      ? await prisma.frente.findMany({ orderBy: { nombre: "asc" } })
      : await prisma.frente.findMany({
          where: { nombre: { in: user.frentes } },
          orderBy: { nombre: "asc" },
        });

  if (user.role === "admin" && frentes.length === 1) {
    redirect(`/trucks/dashboard/${frentes[0].nombre}`);
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

  return <DashboardFrenteSelector frentes={frentes} todayMetrics={todayMetrics} />;
}
