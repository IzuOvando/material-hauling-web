import { create } from "zustand";
import { DateTime } from "luxon";
import CONFIG from "@/config";
import type { DashboardPeriod } from "@/types/dashboard";

interface DashboardState {
  period: DashboardPeriod;
  selectedMaterial: string | null;
  setPeriod: (period: DashboardPeriod) => void;
  setSelectedMaterial: (material: string | null) => void;
}

function defaultPeriod(): DashboardPeriod {
  const now = DateTime.now().setZone(CONFIG.TIMEZONE);
  return { type: "week", weekStart: now.startOf("week").toISODate()! };
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  period: defaultPeriod(),
  selectedMaterial: null,
  setPeriod: (period) => set({ period, selectedMaterial: null }),
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
}));

export function periodToParams(period: DashboardPeriod): Record<string, string> {
  switch (period.type) {
    case "week":
      return { periodType: "week", weekStart: period.weekStart };
    case "month":
      return { periodType: "month", year: String(period.year), month: String(period.month) };
    case "year":
      return { periodType: "year", year: String(period.year) };
  }
}
