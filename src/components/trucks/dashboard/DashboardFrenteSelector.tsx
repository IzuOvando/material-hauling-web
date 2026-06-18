"use client";

import type { Frente } from "@prisma/client";
import {
  FrenteSelector,
  type FrenteKpiSnapshot,
} from "@/components/trucks/FrenteSelector";

export type { FrenteKpiSnapshot };

interface DashboardFrenteSelectorProps {
  frentes: Frente[];
  todayMetrics?: Record<string, FrenteKpiSnapshot>;
}

export function DashboardFrenteSelector({
  frentes,
  todayMetrics,
}: DashboardFrenteSelectorProps) {
  return (
    <FrenteSelector
      frentes={frentes}
      todayMetrics={todayMetrics}
      basePath="/dashboard"
      title="Selecciona un frente"
      subtitle="Elige el frente para visualizar su dashboard de KPIs"
      ctaLabel="Ver dashboard"
    />
  );
}
