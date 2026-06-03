"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Truck, Activity, ArrowRight, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Frente } from "@prisma/client";

export interface FrenteKpiSnapshot {
  totalTrips: number;
  totalM3: number;
  turno1Arrived: number;
  turno2Arrived: number;
}

interface DashboardFrenteSelectorProps {
  frentes: Frente[];
  todayMetrics?: Record<string, FrenteKpiSnapshot>;
}

function suffixNumber(nombre: string): number {
  const match = nombre.match(/-F(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function groupByProject(frentes: Frente[]): Map<string, Frente[]> {
  const map = new Map<string, Frente[]>();
  for (const f of frentes) {
    const project = f.nombre.split(/-F\d/)[0] ?? f.nombre;
    const list = map.get(project) ?? [];
    list.push(f);
    map.set(project, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => suffixNumber(a.nombre) - suffixNumber(b.nombre));
  }
  return map;
}

function parseName(nombre: string): { project: string; suffix: string } {
  const match = nombre.match(/^(.+?)-(.+)$/);
  if (!match) return { project: nombre, suffix: "" };
  return { project: match[1], suffix: match[2] };
}

const PROJECT_PALETTE = [
  {
    headerText:  "text-accent",
    stripe:      "bg-accent/50 group-hover/header:bg-accent",
    cardStripe:  "group-hover:bg-accent",
    badgeBg:     "bg-accent/10 group-hover:bg-accent/20",
    badgeText:   "text-accent",
    hoverBorder: "hover:border-accent/50",
    hoverShadow: "hover:shadow-accent/10",
    hoverFrom:   "hover:from-accent/[0.05]",
    focusRing:   "focus-visible:ring-accent/40",
    arrow:       "text-accent",
  },
  {
    headerText:  "text-secondary",
    stripe:      "bg-secondary/50 group-hover/header:bg-secondary",
    cardStripe:  "group-hover:bg-secondary",
    badgeBg:     "bg-secondary/10 group-hover:bg-secondary/20",
    badgeText:   "text-secondary",
    hoverBorder: "hover:border-secondary/50",
    hoverShadow: "hover:shadow-secondary/10",
    hoverFrom:   "hover:from-secondary/[0.05]",
    focusRing:   "focus-visible:ring-secondary/40",
    arrow:       "text-secondary",
  },
  {
    headerText:  "text-primary",
    stripe:      "bg-primary/40 group-hover/header:bg-primary",
    cardStripe:  "group-hover:bg-primary",
    badgeBg:     "bg-primary/10 group-hover:bg-primary/20",
    badgeText:   "text-primary",
    hoverBorder: "hover:border-primary/50",
    hoverShadow: "hover:shadow-primary/10",
    hoverFrom:   "hover:from-primary/[0.05]",
    focusRing:   "focus-visible:ring-primary/40",
    arrow:       "text-primary",
  },
] as const;

function formatM3(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
}

function StatusBadge({
  hasMetrics,
  hasActivity,
}: {
  hasMetrics: boolean;
  hasActivity: boolean;
}) {
  const active = !hasMetrics || hasActivity;
  return (
    <div
      className={cn(
        "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full",
        "text-[10px] font-semibold whitespace-nowrap",
        active
          ? "bg-accent/15 text-accent"
          : "bg-slate-100 text-slate-500"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          active ? "bg-accent" : "bg-slate-400"
        )}
      />
      {hasMetrics ? (hasActivity ? "Activo" : "Sin actividad") : "Activo"}
    </div>
  );
}

function KpiSection({
  kpi,
  hasActivity,
}: {
  kpi: FrenteKpiSnapshot;
  hasActivity: boolean;
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Truck className="h-3 w-3 shrink-0" />
          <span className="font-semibold text-slate-800">{kpi.totalTrips}</span>
          {" viajes"}
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3 shrink-0" />
          <span className="font-semibold text-slate-800">{formatM3(kpi.totalM3)}</span>
          {" m³"}
        </span>
      </div>

      {hasActivity && (
        <div className="space-y-1">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="bg-secondary/60 transition-all duration-500"
              style={{ width: `${(kpi.turno1Arrived / kpi.totalTrips) * 100}%` }}
            />
            <div
              className="bg-accent/70 transition-all duration-500"
              style={{ width: `${(kpi.turno2Arrived / kpi.totalTrips) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-medium uppercase tracking-wide">
            <span>T1 · {kpi.turno1Arrived}</span>
            <span>{kpi.turno2Arrived} · T2</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardFrenteSelector({
  frentes,
  todayMetrics,
}: DashboardFrenteSelectorProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allGrouped = useMemo(() => groupByProject(frentes), [frentes]);

  const stableProjectIndex = useMemo(() => {
    const map = new Map<string, number>();
    Array.from(allGrouped.keys()).forEach((project, i) => map.set(project, i));
    return map;
  }, [allGrouped]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allGrouped;
    const q = search.trim().toLowerCase();
    const result = new Map<string, Frente[]>();
    for (const [project, projectFrentes] of allGrouped) {
      const displayName = projectFrentes.find((f) => f.displayName)?.displayName ?? "";
      const projectMatches =
        project.toLowerCase().includes(q) || displayName.toLowerCase().includes(q);
      const matching = projectMatches
        ? projectFrentes
        : projectFrentes.filter((f) => f.nombre.toLowerCase().includes(q));
      if (matching.length > 0) result.set(project, matching);
    }
    return result;
  }, [allGrouped, search]);

  const isSearching = search.trim().length > 0;

  function toggleProject(project: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  }

  if (frentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <BarChart3 className="h-12 w-12 text-slate-400" />
        <p className="text-base font-semibold text-slate-600">
          No tienes frentes asignados
        </p>
        <p className="text-sm text-slate-400">
          Contacta a tu administrador para obtener acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Selecciona un frente</h2>
          <p className="text-sm text-slate-500 mt-1">
            Elige el frente para visualizar su dashboard de KPIs
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar frente o proyecto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white",
              "placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/60",
              "transition-colors duration-150"
            )}
          />
        </div>
      </div>

      {filtered.size === 0 && (
        <div className="py-16 text-center text-sm text-slate-500">
          Sin resultados para{" "}
          <span className="font-semibold">&quot;{search}&quot;</span>
        </div>
      )}

      <div className="space-y-6">
        {Array.from(filtered.entries()).map(([project, projectFrentes]) => {
          const palette = PROJECT_PALETTE[(stableProjectIndex.get(project) ?? 0) % PROJECT_PALETTE.length];
          const isCollapsed = !isSearching && collapsed.has(project);
          const projectDisplayName = projectFrentes.find((f) => f.displayName)?.displayName ?? null;

          return (
            <div key={project} className="space-y-3">
              <button
                onClick={() => toggleProject(project)}
                className="w-full flex items-center gap-3 pl-1 group/header"
              >
                <div className={cn("w-0.5 h-6 rounded-full shrink-0 transition-colors duration-150", palette.stripe)} />
                <div className="flex flex-col items-start">
                  {projectDisplayName && (
                    <span className={cn("text-sm font-bold leading-tight", palette.headerText)}>
                      {projectDisplayName}
                    </span>
                  )}
                  <span className={cn(
                    "font-bold uppercase tracking-widest",
                    projectDisplayName
                      ? "text-[10px] text-slate-400"
                      : cn("text-sm", palette.headerText)
                  )}>
                    {project}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {projectFrentes.length}{" "}
                  {projectFrentes.length === 1 ? "frente" : "frentes"}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {projectFrentes.map((frente) => {
                    const kpi = todayMetrics?.[frente.nombre];
                    const hasActivity = (kpi?.totalTrips ?? 0) > 0;
                    const { suffix } = parseName(frente.nombre);

                    return (
                      <button
                        key={frente.nombre}
                        onClick={() => router.push(`/trucks/dashboard/${frente.nombre}`)}
                        className={cn(
                          "group relative text-left w-full rounded-xl border bg-white",
                          "bg-gradient-to-br from-transparent to-transparent",
                          palette.hoverFrom,
                          "transition-all duration-200 ease-out",
                          palette.hoverBorder,
                          "hover:shadow-lg",
                          palette.hoverShadow,
                          "hover:-translate-y-0.5",
                          "active:scale-[0.98] active:translate-y-0",
                          "focus-visible:outline-none focus-visible:ring-2",
                          palette.focusRing
                        )}
                      >
                        <div
                          className={cn(
                            "absolute left-0 top-4 bottom-4 w-[2px] rounded-full",
                            "bg-slate-200 group-hover:top-2 group-hover:bottom-2",
                            palette.cardStripe,
                            "transition-all duration-200"
                          )}
                        />

                        <div className="p-4 pl-5 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {frente.logoUrl ? (
                              <div className="shrink-0 h-10 w-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={frente.logoUrl}
                                  alt={`Logo ${frente.nombre}`}
                                  className="h-full w-full object-contain p-1"
                                />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
                                  palette.badgeBg,
                                  "transition-colors duration-200"
                                )}
                              >
                                <span className={cn("text-[11px] font-bold leading-none", palette.badgeText)}>
                                  {suffix}
                                </span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-none mb-1">
                                {project}
                              </p>
                              <p className="text-base font-bold leading-tight text-slate-900">
                                {suffix || frente.nombre}
                              </p>
                            </div>

                            <StatusBadge
                              hasMetrics={!!todayMetrics}
                              hasActivity={hasActivity}
                            />
                          </div>

                          {kpi ? (
                            <KpiSection kpi={kpi} hasActivity={hasActivity} />
                          ) : (
                            <p className="text-xs text-slate-500 border-t border-slate-200 pt-2">
                              Ver dashboard
                            </p>
                          )}
                        </div>

                        <ArrowRight
                          className={cn(
                            "absolute bottom-4 right-4 h-3.5 w-3.5",
                            palette.arrow,
                            "opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
                            "transition-all duration-200"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
