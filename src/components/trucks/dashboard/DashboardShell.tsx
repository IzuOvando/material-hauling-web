"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDashboardStore, periodToParams } from "@/store/dashboardStore";
import { QuickFilterBar } from "./QuickFilterBar";
import { StatCardsRow, StatCardsRowSkeleton } from "./StatCardsRow";
import { ActiveTrucksCard } from "./ActiveTrucksCard";
import { TimeseriesCharts } from "./TimeseriesCharts";
import { BreakdownChart } from "./BreakdownChart";
import type { SummaryResponse, TimeseriesPoint, BreakdownItem } from "@/types/dashboard";

interface DashboardShellProps {
  frente: string;
}

export function DashboardShell({ frente }: DashboardShellProps) {
  const router = useRouter();
  const { period, setSelectedMaterial } = useDashboardStore();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      frente,
      ...periodToParams(period),
    });

    Promise.all([
      fetch(`/api/trucks/dashboard/summary?${params}`, { signal }).then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error));
        return res.json() as Promise<SummaryResponse>;
      }),
      fetch(`/api/trucks/dashboard/timeseries?${params}`, { signal }).then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error));
        return res.json() as Promise<TimeseriesPoint[]>;
      }),
      fetch(`/api/trucks/dashboard/breakdown?${params}&groupBy=material`, { signal }).then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error));
        return res.json() as Promise<BreakdownItem[]>;
      }),
    ])
      .then(([summaryData, timeseriesData, breakdownData]) => {
        setSummary(summaryData);
        setTimeseries(timeseriesData);
        setBreakdown(breakdownData);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        setError(typeof err === "string" ? err : "Error al cargar datos.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [frente, period]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/trucks/dashboard")}
          aria-label="Volver a proyectos"
          className="h-8 w-8 rounded-full border-2 border-accent/50 flex items-center justify-center text-accent hover:bg-accent hover:border-accent hover:text-white transition-all shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <QuickFilterBar />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex overflow-x-auto">
            <ActiveTrucksCard frente={frente} className="rounded-l-xl" />
            {loading ? (
              <StatCardsRowSkeleton />
            ) : error ? (
              <div className="flex items-center px-4 text-sm text-red-600 border-l border-slate-200">
                {error}
              </div>
            ) : summary ? (
              <StatCardsRow data={summary} />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="checadores">Checadores</TabsTrigger>
          {/* <TabsTrigger value="origen-destino">Origen / Destino</TabsTrigger> — hidden until SDN-141 */}
        </TabsList>
        <TabsContent value="resumen">
          <div className="mt-4 space-y-4">
            <TimeseriesCharts data={timeseries} isLoading={loading} period={period} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BreakdownChart
                title="Viajes por material"
                data={breakdown}
                groupBy="material"
                primaryMetric="trips"
                variant="bar"
                isLoading={loading}
                onBarClick={(label) => setSelectedMaterial(label)}
              />
              <BreakdownChart
                title="Distribución por material"
                data={breakdown}
                groupBy="material"
                primaryMetric="trips"
                variant="pie"
                isLoading={loading}
                onBarClick={(label) => setSelectedMaterial(label)}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="checadores">
          <div className="h-48 rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400 mt-4">
            Checadores — próximamente (SDN-155)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
