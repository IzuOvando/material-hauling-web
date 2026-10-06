"use client";

import type { Frente } from "@prisma/client";
import {
  FrenteSelector,
  type FrenteKpiSnapshot,
} from "@/components/trucks/FrenteSelector";
import whiteLabelConfig from "#/white-label.config";

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
      title={(whiteLabelConfig as any)?.ui?.frenteSelector?.title}
      subtitle={(whiteLabelConfig as any)?.ui?.frenteSelector?.subtitle}
      ctaLabel={(whiteLabelConfig as any)?.ui?.frenteSelector?.ctaLabel}
    />
  );
}
