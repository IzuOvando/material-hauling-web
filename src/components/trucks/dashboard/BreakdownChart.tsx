"use client";

// NOTE (SDN-141): To support new groupBy values (e.g. "origen", "destino"),
// add them to ALLOWED_GROUP_BY in src/types/dashboard.ts — no changes needed here.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { BreakdownItem, BreakdownGroupBy } from "@/types/dashboard";

const PALETTE = [
  "#22543d",
  "#bc955c",
  "#9d2449",
  "#4a7c59",
  "#d4a843",
  "#133223",
  "#e8b87a",
  "#c45a7a",
  "#6aaf82",
  "#7a5a1e",
];

function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

const barConfig = { value: { label: "Valor" } } satisfies ChartConfig;

export interface BreakdownChartProps {
  title: string;
  data: BreakdownItem[];
  groupBy: BreakdownGroupBy; // extend via ALLOWED_GROUP_BY in types/dashboard.ts (SDN-141)
  primaryMetric: "trips" | "m3";
  variant?: "bar" | "pie";
  onBarClick?: (label: string) => void;
  maxItems?: number;
  isLoading?: boolean;
  className?: string;
}

function BreakdownTooltip({
  active,
  payload,
  displayData,
  metricLabel,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  displayData: BreakdownItem[];
  metricLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload as BreakdownItem | undefined;
  const value = payload[0]?.value as number | undefined;
  const idx   = displayData.findIndex((d) => d.label === entry?.label);
  const color = paletteColor(idx >= 0 ? idx : 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md px-3 py-2 text-xs">
      <p className="font-bold text-slate-900 mb-1 capitalize">{entry?.label}</p>
      <p className="flex items-baseline gap-1">
        <span style={{ color, fontWeight: 700 }}>{metricLabel}</span>
        <span style={{ color }}>{value}</span>
      </p>
    </div>
  );
}

function BarChartSkeleton() {
  const widths = [80, 60, 42, 28, 18];
  return (
    <div className="space-y-3 pt-2 pb-1">
      {widths.map((w, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div
            className="h-3 bg-slate-300 rounded animate-pulse w-20 shrink-0"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div
            className="h-7 bg-slate-300 rounded animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 60}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

function PieChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 pt-3 pb-1">
      <div className="h-28 w-28 rounded-full bg-slate-300 animate-pulse" />
      <div className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
            <div className="h-2 w-14 bg-slate-300 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-52 text-sm text-slate-400">
      Sin datos para el período seleccionado
    </div>
  );
}

export function BreakdownChart({
  title,
  data,
  primaryMetric,
  variant = "bar",
  onBarClick,
  maxItems = 10,
  isLoading,
  className,
}: BreakdownChartProps) {
  const dataKey     = primaryMetric;
  const metricLabel = primaryMetric === "trips" ? "Viajes" : "M³";
  const displayData = data.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          variant === "pie" ? <PieChartSkeleton /> : <BarChartSkeleton />
        ) : data.length === 0 ? (
          <Empty />
        ) : variant === "pie" ? (
          <PieVariant
            displayData={displayData}
            dataKey={dataKey}
            metricLabel={metricLabel}
            onBarClick={onBarClick}
          />
        ) : (
          <BarVariant
            displayData={displayData}
            dataKey={dataKey}
            metricLabel={metricLabel}
            onBarClick={onBarClick}
          />
        )}
      </CardContent>
    </Card>
  );
}

function BarYTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#475569"
      fontSize={11}
      fontWeight={700}
      style={{ textTransform: "capitalize" }}
    >
      {payload?.value}
    </text>
  );
}

function BarVariant({
  displayData,
  dataKey,
  metricLabel,
  onBarClick,
}: {
  displayData: BreakdownItem[];
  dataKey: "trips" | "m3";
  metricLabel: string;
  onBarClick?: (label: string) => void;
}) {
  const barHeight = Math.max(192, displayData.length * 36);

  return (
    <ChartContainer config={barConfig} className="w-full" style={{ height: barHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={displayData}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tickLine={false}
            axisLine={false}
            tick={<BarYTick />}
          />
          <Tooltip
            content={(props) => (
              <BreakdownTooltip {...props} displayData={displayData} metricLabel={metricLabel} />
            )}
          />
          <Bar
            dataKey={dataKey}
            radius={[0, 4, 4, 0]}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={onBarClick ? (entry: BreakdownItem) => onBarClick(entry.label) : undefined}
          >
            {displayData.map((entry, i) => (
              <Cell key={entry.label} fill={paletteColor(i)} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

const RADIAN = Math.PI / 180;

function SmartPieLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.02) return null;

  const label = `${(percent * 100).toFixed(0)}%`;
  const cosA  = Math.cos(-midAngle * RADIAN);
  const sinA  = Math.sin(-midAngle * RADIAN);

  if (percent < 0.08) {
    const lineR1 = outerRadius + 4;
    const lineR2 = outerRadius + 18;
    const textR  = outerRadius + 22;
    return (
      <g>
        <line
          x1={cx + lineR1 * cosA} y1={cy + lineR1 * sinA}
          x2={cx + lineR2 * cosA} y2={cy + lineR2 * sinA}
          stroke="#94a3b8" strokeWidth={1}
        />
        <text
          x={cx + textR * cosA} y={cy + textR * sinA}
          fill="#64748b"
          textAnchor={cx + textR * cosA > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={10} fontWeight={600}
        >
          {label}
        </text>
      </g>
    );
  }

  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * cosA} y={cy + r * sinA}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12} fontWeight={700}
    >
      {label}
    </text>
  );
}

function PieVariant({
  displayData,
  dataKey,
  metricLabel,
  onBarClick,
}: {
  displayData: BreakdownItem[];
  dataKey: "trips" | "m3";
  metricLabel: string;
  onBarClick?: (label: string) => void;
}) {
  const pieConfig = displayData.reduce<ChartConfig>((acc, item, i) => {
    acc[item.label] = { label: item.label, color: paletteColor(i) };
    return acc;
  }, {});

  return (
    <ChartContainer config={pieConfig} className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <Pie
            data={displayData}
            dataKey={dataKey}
            nameKey="label"
            cx="50%"
            cy="46%"
            outerRadius={65}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={onBarClick ? (entry: BreakdownItem) => onBarClick(entry.label) : undefined}
            label={SmartPieLabel}
            labelLine={false}
          >
            {displayData.map((entry, i) => (
              <Cell key={entry.label} fill={paletteColor(i)} />
            ))}
          </Pie>
          <Tooltip
            content={(props) => (
              <BreakdownTooltip {...props} displayData={displayData} metricLabel={metricLabel} />
            )}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ fontSize: 11, color: "#475569", textTransform: "capitalize", fontWeight: 600 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
