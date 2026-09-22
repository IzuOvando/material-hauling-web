"use client";

import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboardStore";
import type { DashboardPeriod } from "@/types/dashboard";
import CONFIG from "@/config";
import whiteLabelConfig from "#/white-label.config";

function currentWeekPeriod(): DashboardPeriod {
  return {
    type: "week",
    weekStart: DateTime.now().setZone(CONFIG.TIMEZONE).startOf("week").toISODate()!,
  };
}

function currentMonthPeriod(): DashboardPeriod {
  const now = DateTime.now().setZone(CONFIG.TIMEZONE);
  return { type: "month", year: now.year, month: now.month };
}

function currentYearPeriod(): DashboardPeriod {
  return { type: "year", year: DateTime.now().setZone(CONFIG.TIMEZONE).year };
}

function periodKey(p: DashboardPeriod): string {
  switch (p.type) {
    case "week":  return `week-${p.weekStart}`;
    case "month": return `month-${p.year}-${p.month}`;
    case "year":  return `year-${p.year}`;
  }
}

const FILTERS = [
  { label: whiteLabelConfig.ui.dashboard.filterWeek, make: currentWeekPeriod },
  { label: whiteLabelConfig.ui.dashboard.filterMonth, make: currentMonthPeriod },
  { label: whiteLabelConfig.ui.dashboard.filterYear, make: currentYearPeriod },
] as const;

export function QuickFilterBar() {
  const { period, setPeriod } = useDashboardStore();
  const activePeriodKey = periodKey(period);

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ label, make }) => {
        const p = make();
        const isActive = periodKey(p) === activePeriodKey;
        return (
          <button
            key={label}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
              isActive
                ? "bg-secondary text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-secondary/10 hover:text-secondary"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
