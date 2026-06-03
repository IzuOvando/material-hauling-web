"use client";

import { LogOut, LogIn, BarChart2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "./StatCard";
import type { BreakdownItem } from "@/types/dashboard";

const DEPARTURE_COLOR = "#22543d";
const ARRIVAL_COLOR   = "#bc955c";

interface CheckersTabProps {
  departureData: BreakdownItem[];
  arrivalData:   BreakdownItem[];
  isLoading:     boolean;
}

function RankSkeleton() {
  return (
    <div className="space-y-3 pt-1">
      {[80, 60, 45, 30].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-2 w-3 rounded bg-slate-200 animate-pulse shrink-0" style={{ animationDelay: `${i * 60}ms` }} />
          <div className="h-2 w-28 rounded bg-slate-200 animate-pulse shrink-0" style={{ animationDelay: `${i * 60}ms` }} />
          <div className="h-2 flex-1 rounded bg-slate-200 animate-pulse" style={{ animationDelay: `${i * 60}ms`, maxWidth: `${w}%` }} />
          <div className="h-2 w-6 rounded bg-slate-200 animate-pulse shrink-0" style={{ animationDelay: `${i * 60}ms` }} />
          <div className="h-2 w-10 rounded bg-slate-200 animate-pulse shrink-0" style={{ animationDelay: `${i * 60}ms` }} />
        </div>
      ))}
    </div>
  );
}

function Empty({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-32">
      <BarChart2 className="h-6 w-6 text-slate-200" />
      <p className="text-sm font-medium text-slate-400">{label}</p>
      {hint && <p className="text-xs text-slate-300">{hint}</p>}
    </div>
  );
}

function rateColor(rate: number): string {
  if (rate >= 80) return DEPARTURE_COLOR;
  if (rate >= 60) return "#d4a843";
  return "#9d2449";
}

function CheckerRankChart({
  data,
  barColor,
  badgeFormatter,
  badgeColor,
  badgeHeader,
  emptyLabel,
  emptyHint,
}: {
  data: BreakdownItem[];
  barColor: string;
  badgeFormatter: (item: BreakdownItem) => string | null;
  badgeColor: (item: BreakdownItem) => string;
  badgeHeader: string;
  emptyLabel: string;
  emptyHint?: string;
}) {
  if (data.length === 0) return <Empty label={emptyLabel} hint={emptyHint} />;
  const maxTrips = Math.max(...data.map((d) => d.trips), 1);
  const hasBadge  = data.some((d) => badgeFormatter(d) !== null);

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2.5 pb-2 mb-1 border-b border-slate-100">
        <span className="w-4 shrink-0" />
        <span className="w-32 shrink-0" />
        <span className="flex-1" />
        <span className="w-10 text-right text-[10px] font-semibold uppercase tracking-wider shrink-0 text-slate-500">
          Viajes
        </span>
        {hasBadge && (
          <span className="w-16 text-right text-[10px] font-semibold uppercase tracking-wider shrink-0"
            style={{ color: barColor + "cc" }}>
            {badgeHeader}
          </span>
        )}
      </div>
    <div className="space-y-2.5 pt-1">
      {data.map((item, i) => {
        const badge  = badgeFormatter(item);
        const pct    = (item.trips / maxTrips) * 100;
        const bColor = badgeColor(item);
        return (
          <div key={item.label} className="flex items-center gap-2.5 text-xs min-w-0">
            {/* Rank */}
            <span className="w-4 text-right font-mono text-slate-500 shrink-0 select-none">
              {i + 1}
            </span>
            {/* Name — truncated, full name on hover */}
            <span
              className="w-32 truncate font-medium text-slate-700 shrink-0"
              title={item.label}
            >
              {item.label}
            </span>
            {/* Progress bar */}
            <div className="flex-1 relative h-1.5 rounded-full bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            {/* Trip count */}
            <span
              className="w-10 text-right font-bold tabular-nums shrink-0"
              style={{ color: barColor }}
            >
              {item.trips}
            </span>
            {/* Badge */}
            {badge && (
              <span
                className="w-16 text-right text-[10px] font-semibold tabular-nums shrink-0"
                style={{ color: bColor }}
              >
                {badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
}

function StatCardSkeleton() {
  return <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />;
}

export function CheckersTab({ departureData, arrivalData, isLoading }: CheckersTabProps) {
  const topDeparture = departureData[0];
  const topArrival   = arrivalData[0];

  // Best arrival rate — min 3 trips for statistical confidence
  const bestRateChecker = [...departureData]
    .filter((d) => d.trips >= 3 && d.rate !== undefined)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];

  // Fastest transit — min 3 trips for statistical confidence
  const fastestChecker = [...arrivalData]
    .filter((d) => d.trips >= 3 && d.rate !== undefined && (d.rate ?? 0) > 0)
    .sort((a, b) => (a.rate ?? Infinity) - (b.rate ?? Infinity))[0];

  return (
    <div className="mt-4 space-y-4">

      {/* KPI cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Más activo en salida"
              value={topDeparture?.label ?? "—"}
              subtitle={topDeparture ? `${topDeparture.trips} despachos` : undefined}
              icon={LogOut}
              colorVariant="primary"
            />
            <StatCard
              title="Más activo en llegada"
              value={topArrival?.label ?? "—"}
              subtitle={topArrival ? `${topArrival.trips} recepciones` : undefined}
              icon={LogIn}
              colorVariant="accent"
            />
            <StatCard
              title="Mejor tasa de llegada"
              value={bestRateChecker ? `${bestRateChecker.rate ?? 0}%` : "—"}
              subtitle={bestRateChecker ? bestRateChecker.label : "Sin suficientes datos (mín. 3 viajes)"}
              icon={LogOut}
              colorVariant="primary"
            />
            <StatCard
              title="Tránsito más rápido"
              value={fastestChecker ? `${fastestChecker.rate ?? 0} min` : "—"}
              subtitle={fastestChecker ? fastestChecker.label : "Sin suficientes datos (mín. 3 viajes)"}
              icon={LogIn}
              colorVariant="accent"
            />
          </>
        )}
      </div>

      {/* Charts — 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-900">
              Salida por checador
            </CardTitle>
            <p className="text-[11px] text-slate-500">Despachos · tasa de llegada</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RankSkeleton />
            ) : (
              <CheckerRankChart
                data={departureData}
                barColor={DEPARTURE_COLOR}
                badgeFormatter={(item) =>
                  item.rate !== undefined ? `${item.rate}%` : null
                }
                badgeColor={(item) => rateColor(item.rate ?? 0)}
                badgeHeader="Tasa"
                emptyLabel="Sin despachos en este período"
                emptyHint="No hay registros de salida para el filtro seleccionado"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-900">
              Llegada por checador
            </CardTitle>
            <p className="text-[11px] text-slate-500">Recepciones · tiempo promedio</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RankSkeleton />
            ) : (
              <CheckerRankChart
                data={arrivalData}
                barColor={ARRIVAL_COLOR}
                badgeFormatter={(item) =>
                  item.rate !== undefined ? `${item.rate} min` : null
                }
                badgeColor={() => ARRIVAL_COLOR}
                badgeHeader="Promedio"
                emptyLabel="Sin recepciones en este período"
                emptyHint="No hay registros de llegada para el filtro seleccionado"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
