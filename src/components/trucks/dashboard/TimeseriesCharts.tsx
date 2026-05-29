"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DateTime } from "luxon";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { TimeseriesPoint, DashboardPeriod } from "@/types/dashboard";

const TRIPS_COLOR = "#133223";
const M3_COLOR    = "#bc955c";

const tripsConfig = { trips: { label: "Viajes", color: TRIPS_COLOR } } satisfies ChartConfig;
const m3Config    = { m3:    { label: "M³",     color: M3_COLOR    } } satisfies ChartConfig;

function formatTick(date: string, periodType: DashboardPeriod["type"]): string {
  const dt = DateTime.fromISO(date).setLocale("es");
  return periodType === "year" ? dt.toFormat("MMM yy") : dt.toFormat("d MMM");
}

function niceMax(values: number[], tickCount = 5): number {
  const max = Math.max(...values, 1);
  const rawStep = max / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
  return niceStep * (tickCount - 1);
}

function AreaTooltip({
  active,
  payload,
  label,
  color,
  seriesLabel,
  formatLabel,
}: {
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

function AreaChartSkeleton() {
  return (
    <div className="h-36 w-full flex gap-3 pt-1">
      <div className="flex flex-col justify-between w-8 shrink-0 py-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-2 bg-slate-300 rounded animate-pulse"
            style={{ animationDelay: `${i * 60}ms`, width: i % 2 === 0 ? "100%" : "65%" }}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex-1 rounded-lg bg-slate-300 animate-pulse" style={{ animationDelay: "80ms" }} />
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-2 bg-slate-300 rounded animate-pulse flex-1"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyContent() {
  return (
    <div className="flex items-center justify-center h-36 text-sm text-slate-400">
      Sin datos para el período seleccionado
    </div>
  );
}

interface TimeseriesChartsProps {
  data: TimeseriesPoint[];
  period: DashboardPeriod;
  isLoading?: boolean;
  className?: string;
}

export function TimeseriesCharts({ data, period, isLoading, className }: TimeseriesChartsProps) {
  const periodType   = period.type;
  const ticker       = (date: string) => formatTick(date, periodType);
  const tickInterval = data.length > 14 ? Math.floor(data.length / 7) : 0;

  const hasTrips = data.some((d) => d.trips > 0);
  const hasM3    = data.some((d) => d.m3 > 0);

  const tripsMax   = hasTrips ? niceMax(data.map((d) => d.trips)) : 4;
  const m3Max      = hasM3    ? niceMax(data.map((d) => d.m3))    : 4;
  const tripsTicks = Array.from({ length: 5 }, (_, i) => (tripsMax / 4) * i);
  const m3Ticks    = Array.from({ length: 5 }, (_, i) => (m3Max   / 4) * i);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className ?? ""}`}>
        <CardShell title="Viajes completados por día"><AreaChartSkeleton /></CardShell>
        <CardShell title="M³ acarreados por día"><AreaChartSkeleton /></CardShell>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className ?? ""}`}>
      <CardShell title="Viajes completados por día">
        {!hasTrips ? <EmptyContent /> : (
          <ChartContainer config={tripsConfig} className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                syncId="dashboard-sync"
                accessibilityLayer
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  interval={tickInterval}
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, payload }) => (
                    <text x={x} y={y} dy={12} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={700}>
                      {ticker(payload.value as string)}
                    </text>
                  )}
                />
                <YAxis
                  ticks={tripsTicks}
                  domain={[0, tripsMax]}
                  allowDecimals={false}
                  tickFormatter={(v: number) => String(Math.round(v))}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  content={(props) => (
                    <AreaTooltip
                      {...props}
                      color={TRIPS_COLOR}
                      seriesLabel="Viajes"
                      formatLabel={ticker}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="trips"
                  fill={TRIPS_COLOR}
                  stroke={TRIPS_COLOR}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardShell>

      <CardShell title="M³ acarreados por día">
        {!hasM3 ? <EmptyContent /> : (
          <ChartContainer config={m3Config} className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                syncId="dashboard-sync"
                accessibilityLayer
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  interval={tickInterval}
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, payload }) => (
                    <text x={x} y={y} dy={12} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={700}>
                      {ticker(payload.value as string)}
                    </text>
                  )}
                />
                <YAxis
                  ticks={m3Ticks}
                  domain={[0, m3Max]}
                  allowDecimals={false}
                  tickFormatter={(v: number) => String(Math.round(v))}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  content={(props) => (
                    <AreaTooltip
                      {...props}
                      color={M3_COLOR}
                      seriesLabel="M³"
                      formatLabel={ticker}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="m3"
                  fill={M3_COLOR}
                  stroke={M3_COLOR}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardShell>

    </div>
  );
}
