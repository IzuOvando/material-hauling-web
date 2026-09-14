import { CheckCircle2, Package, TrendingUp, PieChart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SummaryResponse } from "@/types/dashboard";
import whiteLabelConfig from "../../../../white-label.config";

interface StatCardsRowProps {
  data: SummaryResponse;
  className?: string;
}

export function StatCardsRow({ data, className }: StatCardsRowProps) {
  const metrics = [
    {
      label: whiteLabelConfig.ui.dashboard.statTrips,
      value: data.totalTrips,
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      label: whiteLabelConfig.ui.dashboard.statM3Hauled,
      value: data.totalM3.toFixed(2),
      icon: Package,
      color: "text-primary",
    },
    {
      label: whiteLabelConfig.ui.dashboard.statM3PerTrip,
      value: data.avgM3PerTrip.toFixed(2),
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      label: whiteLabelConfig.ui.dashboard.statArrivalRate,
      value: `${data.arrivalRate.toFixed(1)}%`,
      icon: PieChart,
      color: "text-secondary",
    },
    {
      label: whiteLabelConfig.ui.dashboard.statShifts,
      value: `T1: ${data.turno1Arrived} · T2: ${data.turno2Arrived}`,
      icon: Clock,
      color: "text-primary",
    },
  ] as const;

  return (
    <>
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-1.5 px-4 py-3 min-w-[110px] flex-1 border-l border-slate-200",
              className
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn("h-3 w-3 shrink-0", m.color)} />
              <p className="text-[11px] text-slate-800 leading-none truncate">{m.label}</p>
            </div>
            <p className={cn("text-base font-bold leading-none", m.color)}>{m.value}</p>
          </div>
        );
      })}
    </>
  );
}

export function StatCardsRowSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-4 py-3 flex-1 border-l border-slate-200">
          <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          <div className="h-5 w-10 rounded bg-slate-100 animate-pulse" />
        </div>
      ))}
    </>
  );
}
