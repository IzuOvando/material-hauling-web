import { DateTime } from "luxon";
import CONFIG from "@/config";
import type { PeriodPreset } from "@/types/trucks-filters";

export interface DateRange {
  from: string;
  to: string;
}

function nowInZone(): DateTime {
  return DateTime.now().setZone(CONFIG.TIMEZONE);
}

function toISODate(dt: DateTime): string {
  return dt.toISODate() ?? "";
}

export function getPeriodRange(preset: Exclude<PeriodPreset, "custom">): DateRange {
  const now = nowInZone();
  switch (preset) {
    case "yesterday": {
      const day = now.minus({ days: 1 }).startOf("day");
      return { from: toISODate(day), to: toISODate(day) };
    }
    case "today": {
      return { from: toISODate(now.startOf("day")), to: toISODate(now.startOf("day")) };
    }
    case "last7": {
      const to = now.startOf("day");
      const from = to.minus({ days: 6 });
      return { from: toISODate(from), to: toISODate(to) };
    }
    case "thisMonth": {
      return {
        from: toISODate(now.startOf("month")),
        to: toISODate(now.endOf("month").startOf("day")),
      };
    }
  }
}

export function rangeToString(range: DateRange): string {
  return `${range.from}..${range.to}`;
}

export function parseRange(value: string | null | undefined): DateRange | null {
  if (!value) return null;
  const [from, to] = value.split("..").map((s) => s.trim());
  if (!from || !to) return null;
  return { from, to };
}

export function detectPreset(range: DateRange): PeriodPreset {
  for (const preset of ["yesterday", "today", "last7", "thisMonth"] as const) {
    const presetRange = getPeriodRange(preset);
    if (presetRange.from === range.from && presetRange.to === range.to) {
      return preset;
    }
  }
  return "custom";
}

export function getDefaultRangeString(): string {
  return rangeToString(getPeriodRange("yesterday"));
}

const SPANISH_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const SPANISH_MONTHS_FULL = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Range spanning a whole calendar month (1st → last day), in the app timezone.
 * `month` is 1-based (1 = January) to match the picker UI.
 */
export function getMonthRange(year: number, month: number): DateRange {
  const start = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: CONFIG.TIMEZONE }
  ).startOf("month");
  return {
    from: toISODate(start),
    to: toISODate(start.endOf("month").startOf("day")),
  };
}

/** True when the range covers exactly one full calendar month. */
export function isFullMonthRange(range: DateRange | null | undefined): boolean {
  if (!range) return false;
  const from = DateTime.fromISO(range.from, { zone: CONFIG.TIMEZONE });
  const to = DateTime.fromISO(range.to, { zone: CONFIG.TIMEZONE });
  if (!from.isValid || !to.isValid) return false;
  if (from.year !== to.year || from.month !== to.month) return false;
  return (
    from.day === from.startOf("month").day &&
    to.day === to.endOf("month").day
  );
}

/** Human label for a month range, e.g. "junio 2026". */
export function formatMonthYear(range: DateRange): string {
  const from = DateTime.fromISO(range.from, { zone: CONFIG.TIMEZONE });
  if (!from.isValid) return formatRangeShort(range);
  return `${SPANISH_MONTHS_FULL[from.month - 1]} ${from.year}`;
}

export function formatRangeShort(range: DateRange): string {
  const from = DateTime.fromISO(range.from, { zone: CONFIG.TIMEZONE });
  const to = DateTime.fromISO(range.to, { zone: CONFIG.TIMEZONE });
  if (!from.isValid || !to.isValid) return `${range.from} – ${range.to}`;

  if (range.from === range.to) {
    return `${from.day} ${SPANISH_MONTHS[from.month - 1]}`;
  }

  if (from.year === to.year) {
    if (from.month === to.month) {
      return `${from.day}–${to.day} ${SPANISH_MONTHS[from.month - 1]}`;
    }
    return `${from.day} ${SPANISH_MONTHS[from.month - 1]} – ${to.day} ${SPANISH_MONTHS[to.month - 1]}`;
  }

  return `${from.day} ${SPANISH_MONTHS[from.month - 1]} ${from.year} – ${to.day} ${SPANISH_MONTHS[to.month - 1]} ${to.year}`;
}
