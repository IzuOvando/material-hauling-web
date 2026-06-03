"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useDashboardStore, periodToParams } from "@/store/dashboardStore";
import type { TimeseriesPoint, DashboardPeriod } from "@/types/dashboard";

const TRIPS_COLOR = "#22543d";
const ACCENT      = "#bc955c";

interface DrilldownSectionProps {
  frente: string;
  period: DashboardPeriod;
  materialColor: string;
}

interface Group {
  key: string;
  label: string;
  rows: TimeseriesPoint[];
  activeRows: TimeseriesPoint[];
  totalTrips: number;
  totalM3: number;
  inactiveCount: number;
}

function groupData(data: TimeseriesPoint[], period: DashboardPeriod): Group[] | null {
  if (period.type === "week") return null;

  const map = new Map<string, TimeseriesPoint[]>();
  for (const p of data) {
    let key: string;
    if (period.type === "year") {
      key = p.date.substring(0, 7);
    } else {
      const dt = DateTime.fromISO(p.date);
      key = `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, "0")}`;
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  return Array.from(map.entries()).map(([key, rows]) => {
    const activeRows = rows.filter((r) => r.trips > 0 || r.m3 > 0);
    let label: string;
    if (period.type === "year") {
      label = DateTime.fromISO(key + "-01").setLocale("es").toFormat("MMMM yyyy");
    } else {
      const first = DateTime.fromISO(rows[0].date).setLocale("es");
      const last  = DateTime.fromISO(rows[rows.length - 1].date).setLocale("es");
      label = `${first.toFormat("d MMM")} – ${last.toFormat("d MMM")}`;
    }
    return {
      key,
      label,
      rows,
      activeRows,
      totalTrips: rows.reduce((s, r) => s + r.trips, 0),
      totalM3:    rows.reduce((s, r) => s + r.m3,    0),
      inactiveCount: rows.length - activeRows.length,
    };
  });
}

function niceMax(values: number[]): number {
  const raw = Math.max(...values, 0);
  if (raw === 0) return 4;
  return Math.ceil(raw / 4) * 4;
}

function formatTick(date: string, periodType: DashboardPeriod["type"]): string {
  const dt = DateTime.fromISO(date).setLocale("es");
  if (periodType === "year") return dt.toFormat("MMM");
  if (periodType === "week") return dt.toFormat("EEE d");
  return dt.toFormat("d MMM");
}

function DrilldownTooltip({ active, payload, label, color, seriesLabel, formatLabel }: {
  active?: boolean;
  payload?: unknown[];
  label?: string;
  color: string;
  seriesLabel: string;
  formatLabel: (d: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = (payload[0] as Record<string, unknown>)?.value as number | undefined;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md px-3 py-2 text-xs">
      <p className="font-bold text-slate-900 mb-1">{formatLabel(label as string)}</p>
      <p className="flex items-baseline gap-1">
        <span style={{ color, fontWeight: 700 }}>{seriesLabel}</span>
        <span style={{ color }}>{value}</span>
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-32 w-full flex gap-2 pt-1">
      <div className="flex flex-col justify-between w-6 shrink-0 py-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1.5 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: `${i * 60}ms`, width: i % 2 === 0 ? "100%" : "60%" }} />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex-1 rounded-lg bg-slate-200 animate-pulse" />
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 bg-slate-200 rounded animate-pulse flex-1"
              style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="px-6 py-3 space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4"
          style={{ animationDelay: `${i * 60}ms` }}>
          <div className="h-3 w-4 rounded bg-slate-200 animate-pulse shrink-0" />
          <div className="h-3 flex-1 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-10 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-14 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function FlatTable({ data }: { data: TimeseriesPoint[] }) {
  const activeRows    = data.filter((r) => r.trips > 0 || r.m3 > 0);
  const inactiveCount = data.length - activeRows.length;
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <th className="text-left px-6 py-2.5 font-semibold uppercase tracking-wider text-slate-400">Fecha</th>
          <th className="text-right w-16 pr-3 py-2.5 font-semibold uppercase tracking-wider whitespace-nowrap"
            style={{ color: TRIPS_COLOR + "99" }}>Viajes</th>
          <th className="text-right w-20 pl-5 pr-6 py-2.5 font-semibold uppercase tracking-wider whitespace-nowrap border-l border-slate-100"
            style={{ color: ACCENT + "99" }}>M³</th>
        </tr>
      </thead>
      <tbody>
        {activeRows.length === 0 ? (
          <tr>
            <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
              Sin actividad esta semana
            </td>
          </tr>
        ) : (
          <>
            {activeRows.map((row) => (
              <tr key={row.date} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors duration-100">
                <td className="px-6 py-2" style={{ color: "#9d2449cc" }}>
                  {DateTime.fromISO(row.date).setLocale("es").toFormat("EEE d MMM")}
                </td>
                <td className="w-16 pr-3 py-2 text-right font-semibold tabular-nums"
                  style={{ color: TRIPS_COLOR }}>
                  {row.trips}
                </td>
                <td className="w-20 pl-5 pr-6 py-2 text-right font-semibold tabular-nums border-l border-slate-100"
                  style={{ color: ACCENT + "cc" }}>
                  {row.m3.toFixed(2)}
                </td>
              </tr>
            ))}
            {inactiveCount > 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-2 text-[11px] text-black">
                  {inactiveCount} {inactiveCount === 1 ? "día" : "días"} sin actividad
                </td>
              </tr>
            )}
          </>
        )}
      </tbody>
    </table>
  );
}

export function DrilldownSection({ frente, period, materialColor }: DrilldownSectionProps) {
  const { selectedMaterial, setSelectedMaterial } = useDashboardStore();
  const [data, setData]             = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedMaterial) return;
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    const params = new URLSearchParams({
      frente,
      ...periodToParams(period),
      material: selectedMaterial.toLowerCase().trim(),
    });
    fetch(`/api/trucks/dashboard/timeseries?${params}`, { signal })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error));
        return res.json() as Promise<TimeseriesPoint[]>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        setData([]);
        setLoading(false);
      });
    return () => controller.abort();
  }, [frente, period, selectedMaterial]);

  useEffect(() => {
    const groups = groupData(data, period);
    if (!groups) return;
    const lastActive = [...groups].reverse().find((g) => g.totalTrips > 0 || g.totalM3 > 0);
    setExpandedGroups(lastActive ? new Set([lastActive.key]) : new Set());
  }, [data, period]);

  const totalTrips = data.reduce((s, d) => s + d.trips, 0);
  const totalM3    = data.reduce((s, d) => s + d.m3,    0);
  const avgM3      = totalTrips > 0 ? totalM3 / totalTrips : 0;

  const tripsConfig: ChartConfig = { trips: { label: "Viajes", color: TRIPS_COLOR } } satisfies ChartConfig;
  const m3Config:    ChartConfig = { m3:    { label: "M³",     color: ACCENT      } } satisfies ChartConfig;

  const hasData    = data.some((d) => d.trips > 0 || d.m3 > 0);
  const periodType = period.type;
  const ticker     = (date: string) => formatTick(date, periodType);

  const xTicks: string[] | undefined =
    period.type === "year"
      ? data.filter((d) => d.date.slice(8) === "01").map((d) => d.date)
      : undefined;
  const tickInterval =
    period.type === "month" ? Math.max(1, Math.floor(data.length / 5)) : 0;

  const tripsMax   = niceMax(data.map((d) => d.trips));
  const m3Max      = niceMax(data.map((d) => d.m3));
  const tripsTicks = Array.from({ length: 5 }, (_, i) => (tripsMax / 4) * i);
  const m3Ticks    = Array.from({ length: 5 }, (_, i) => (m3Max   / 4) * i);
  const groups     = groupData(data, period);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Sheet
      open={!!selectedMaterial}
      onOpenChange={(open) => { if (!open) setSelectedMaterial(null); }}
    >
      <SheetContent
        side="right"
        className="sm:max-w-[520px] p-0 flex flex-col overflow-hidden"
      >
        <SheetTitle className="sr-only">Detalle de material</SheetTitle>
        <SheetDescription className="sr-only">
          Información detallada del material seleccionado
        </SheetDescription>

        <div className="flex-none border-b border-slate-100 px-6 pt-5 pb-4 pr-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full flex-none" style={{ backgroundColor: materialColor }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Detalle
            </span>
            <span className="text-base font-bold text-slate-900 capitalize">
              {selectedMaterial ?? "—"}
            </span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 rounded-lg px-3 py-2"
              style={{ backgroundColor: materialColor + "18" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: materialColor }}>Viajes</p>
              {loading ? (
                <div className="h-5 w-10 rounded bg-slate-200 animate-pulse mt-0.5" />
              ) : (
                <p className="text-lg font-bold leading-none tabular-nums"
                  style={{ color: materialColor }}>
                  {totalTrips.toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex-1 rounded-lg px-3 py-2"
              style={{ backgroundColor: ACCENT + "18" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: ACCENT }}>M³ total</p>
              {loading ? (
                <div className="h-5 w-10 rounded bg-slate-200 animate-pulse mt-0.5" />
              ) : (
                <p className="text-lg font-bold leading-none tabular-nums"
                  style={{ color: ACCENT }}>
                  {totalM3.toFixed(1)}
                </p>
              )}
            </div>

            <div className="flex-1 rounded-lg px-3 py-2 bg-slate-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-slate-400">
                M³/viaje
              </p>
              {loading ? (
                <div className="h-5 w-10 rounded bg-slate-200 animate-pulse mt-0.5" />
              ) : (
                <p className="text-lg font-bold leading-none tabular-nums text-slate-600">
                  {avgM3.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(loading || hasData) && (
            <div className="px-6 py-4 space-y-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                  style={{ color: TRIPS_COLOR }}>
                  Viajes / día
                </p>
                {loading ? <ChartSkeleton /> : (
                  <ChartContainer config={tripsConfig} className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} accessibilityLayer margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" ticks={xTicks} interval={xTicks ? 0 : tickInterval}
                          tickLine={false} axisLine={false}
                          tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
                            <text x={x} y={y + 9} textAnchor="middle" fontSize={9} fontWeight={700} fill="#64748b">
                              {ticker(payload.value)}
                            </text>
                          )}
                        />
                        <YAxis domain={[0, tripsMax]} ticks={tripsTicks} tickLine={false} axisLine={false}
                          width={24} tickFormatter={(v) => String(Math.round(v))}
                          tick={{ fontSize: 9, fill: "#64748b" }}
                        />
                        <Tooltip content={(props) => (
                          <DrilldownTooltip {...props} color={TRIPS_COLOR} seriesLabel="Viajes" formatLabel={ticker} />
                        )} />
                        <Area type="monotone" dataKey="trips" stroke={TRIPS_COLOR} fill={TRIPS_COLOR}
                          fillOpacity={0.15} strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                  style={{ color: ACCENT }}>
                  M³ / día
                </p>
                {loading ? <ChartSkeleton /> : (
                  <ChartContainer config={m3Config} className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} accessibilityLayer margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" ticks={xTicks} interval={xTicks ? 0 : tickInterval}
                          tickLine={false} axisLine={false}
                          tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
                            <text x={x} y={y + 9} textAnchor="middle" fontSize={9} fontWeight={700} fill="#64748b">
                              {ticker(payload.value)}
                            </text>
                          )}
                        />
                        <YAxis domain={[0, m3Max]} ticks={m3Ticks} tickLine={false} axisLine={false}
                          width={24} tickFormatter={(v) => String(Math.round(v))}
                          tick={{ fontSize: 9, fill: "#64748b" }}
                        />
                        <Tooltip content={(props) => (
                          <DrilldownTooltip {...props} color={ACCENT} seriesLabel="M³" formatLabel={ticker} />
                        )} />
                        <Area type="monotone" dataKey="m3" stroke={ACCENT} fill={ACCENT}
                          fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </div>
            </div>
          )}

          {!loading && !hasData && data.length > 0 && (
            <div className="px-6 py-3 border-b border-slate-100">
              <p className="text-xs text-slate-400">
                Sin datos suficientes — la tabla es la vista principal para este período.
              </p>
            </div>
          )}

          {!loading ? (
            <>
              {!groups && <FlatTable data={data} />}
              {groups && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
                      <th className="text-left pl-10 pr-4 py-2.5 font-semibold uppercase tracking-wider"
                        style={{ color: "#9d244999" }}>
                        {period.type === "year" ? "Mes" : "Semana"}
                      </th>
                      <th className="text-right w-16 pr-3 py-2.5 font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: TRIPS_COLOR + "99" }}>
                        Viajes
                      </th>
                      <th className="text-right w-20 pl-5 pr-6 py-2.5 font-semibold uppercase tracking-wider whitespace-nowrap border-l border-slate-100"
                        style={{ color: ACCENT + "99" }}>
                        M³
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => {
                      const isExpanded = expandedGroups.has(group.key);
                      const isActive   = group.totalTrips > 0 || group.totalM3 > 0;
                      return (
                        <>
                          <tr
                            key={group.key + "-header"}
                            onClick={() => toggleGroup(group.key)}
                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors duration-100"
                          >
                            <td className="pl-6 pr-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {isExpanded
                                  ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                  : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                }
                                <span className="font-semibold capitalize" style={{ color: "#9d2449" }}>{group.label}</span>
                              </div>
                            </td>
                            {isActive ? (
                              <>
                                <td className="w-16 pr-3 py-2.5 text-right font-semibold tabular-nums"
                                  style={{ color: TRIPS_COLOR }}>
                                  {group.totalTrips}
                                </td>
                                <td className="w-20 pl-5 pr-6 py-2.5 text-right font-semibold tabular-nums border-l border-slate-100"
                                  style={{ color: ACCENT + "cc" }}>
                                  {group.totalM3.toFixed(1)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="w-16 pr-3 py-2.5 text-right tabular-nums text-black">—</td>
                                <td className="w-20 pl-5 pr-6 py-2.5 text-right tabular-nums border-l border-slate-100 text-black">—</td>
                              </>
                            )}
                          </tr>

                          {isExpanded && group.activeRows.map((row) => (
                            <tr key={row.date}
                              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors duration-100">
                              <td className="pr-4 py-1.5"
                                style={{ paddingLeft: "2.75rem", borderLeft: `2px solid ${materialColor}35`, color: "#9d2449cc" }}>
                                {DateTime.fromISO(row.date).setLocale("es").toFormat("EEE d MMM")}
                              </td>
                              <td className="w-16 pr-3 py-1.5 text-right font-semibold tabular-nums"
                                style={{ color: TRIPS_COLOR }}>
                                {row.trips}
                              </td>
                              <td className="w-20 pl-5 pr-6 py-1.5 text-right font-semibold tabular-nums border-l border-slate-100"
                                style={{ color: ACCENT + "cc" }}>
                                {row.m3.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {isExpanded && group.inactiveCount > 0 && (
                            <tr className="border-b border-slate-50">
                              <td colSpan={3} className="py-1.5 text-[11px] text-black"
                                style={{ paddingLeft: "2.75rem", borderLeft: `2px solid ${materialColor}35` }}>
                                {group.inactiveCount} {group.inactiveCount === 1 ? "día" : "días"} sin actividad
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <TableSkeleton />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
