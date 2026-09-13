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
import { DrilldownSection } from "./DrilldownSection";
import { CheckersTab } from "./CheckersTab";
import { OrigenDestinoTab } from "./OrigenDestinoTab";
import type { SummaryResponse, TimeseriesPoint, BreakdownItem } from "@/types/dashboard";
import whiteLabelConfig from "../../../../white-label.config";

interface DashboardShellProps {
  frente: string;
}

export function DashboardShell({ frente }: DashboardShellProps) {
  const router = useRouter();
  const { period, setSelectedMaterial } = useDashboardStore();
  const [materialColor, setMaterialColor] = useState<string>("#22543d");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [departureCheckers, setDepartureCheckers] = useState<BreakdownItem[]>([]);
  const [arrivalCheckers, setArrivalCheckers] = useState<BreakdownItem[]>([]);
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
      fetch(`/api/trucks/dashboard/breakdown?${params}&groupBy=departureChecker`, { signal }).then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error));
        return res.json() as Promise<BreakdownItem[]>;
      }),
      fetch(`/api/trucks/dashboard/breakdown?${params}&groupBy=arrivalChecker`, { signal }).then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error));
        return res.json() as Promise<BreakdownItem[]>;
      }),
    ])
      .then(([summaryData, timeseriesData, breakdownData, departureData, arrivalData]) => {
        setSummary(summaryData);
        setTimeseries(timeseriesData);
        setBreakdown(breakdownData);
        setDepartureCheckers(departureData);
        setArrivalCheckers(arrivalData);
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
          onClick={() => router.push("/dashboard")}
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
          <TabsTrigger value="resumen">{whiteLabelConfig.ui.dashboard.summaryTab}</TabsTrigger>
          <TabsTrigger value="checadores">{whiteLabelConfig.ui.dashboard.checkersTab}</TabsTrigger>
          {/* <TabsTrigger value="origen-destino">Origen / Destino</TabsTrigger> */}
        </TabsList>
        <TabsContent value="resumen">
          <div className="mt-4 space-y-4">
            <TimeseriesCharts data={timeseries} isLoading={loading} period={period} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BreakdownChart
                title={whiteLabelConfig.ui.dashboard.tripsByMaterial}
                data={breakdown}
                groupBy="material"
                primaryMetric="trips"
                variant="bar"
                isLoading={loading}
                onBarClick={(label, color) => { setSelectedMaterial(label); setMaterialColor(color); }}
              />
              <BreakdownChart
                title={whiteLabelConfig.ui.dashboard.materialDistribution}
                data={breakdown}
                groupBy="material"
                primaryMetric="trips"
                variant="pie"
                isLoading={loading}
                onBarClick={(label, color) => { setSelectedMaterial(label); setMaterialColor(color); }}
              />
            </div>
            <DrilldownSection frente={frente} period={period} materialColor={materialColor} />
          </div>
        </TabsContent>
        <TabsContent value="checadores">
          <CheckersTab departureData={departureCheckers} arrivalData={arrivalCheckers} isLoading={loading} />
        </TabsContent>
        <TabsContent value="origen-destino">
          <OrigenDestinoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
