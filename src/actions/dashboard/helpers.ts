import { DateTime } from "luxon";
import CONFIG from "@/config";
import type { DashboardFilters, DashboardPeriod } from "@/types/dashboard";

export function parsePeriodFromParams(searchParams: URLSearchParams): DashboardPeriod {
  const periodType = searchParams.get("periodType");

  if (periodType === "week") {
    const weekStart = searchParams.get("weekStart");
    if (!weekStart) throw new Error("Se requiere el parámetro 'weekStart' para periodType=week (YYYY-MM-DD, debe ser lunes)");
    return { type: "week", weekStart };
  }

  if (periodType === "month") {
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month");
    if (!yearStr || !monthStr) throw new Error("Se requieren los parámetros 'year' y 'month' para periodType=month");
    return { type: "month", year: Number(yearStr), month: Number(monthStr) };
  }

  if (periodType === "year") {
    const yearStr = searchParams.get("year");
    if (!yearStr) throw new Error("Se requiere el parámetro 'year' para periodType=year");
    return { type: "year", year: Number(yearStr) };
  }

  throw new Error("periodType inválido. Valores aceptados: week, month, year");
}

export function getDashboardPeriodFilters(
  frente: string,
  period: DashboardPeriod
): DashboardFilters {
  if (!frente || frente.trim() === "") {
    throw new Error("El frente no puede estar vacío");
  }

  const now = DateTime.now().setZone(CONFIG.TIMEZONE);
  const currentYear = now.year;
  const previousYear = currentYear - 1;

  let dateFrom: DateTime;
  let dateTo: DateTime;

  switch (period.type) {
    case "week": {
      const d = DateTime.fromISO(period.weekStart, { zone: CONFIG.TIMEZONE });
      if (!d.isValid) throw new Error(`Fecha inválida: ${period.weekStart}`);
      if (d.weekday !== 1) throw new Error("weekStart debe ser lunes (día ISO 1 de la semana)");
      if (d.year !== currentYear) {
        throw new Error(`Solo se permiten semanas del año en curso (${currentYear})`);
      }
      if (d.startOf("day") > now.startOf("day")) {
        throw new Error("No se pueden consultar semanas futuras");
      }
      dateFrom = d.startOf("day");
      const weekEnd = d.plus({ days: 6 }).endOf("day");
      dateTo = weekEnd > now.endOf("day") ? now.endOf("day") : weekEnd;
      break;
    }
    case "month": {
      if (!Number.isInteger(period.month) || period.month < 1 || period.month > 12) {
        throw new Error("El mes debe ser un número entero entre 1 y 12");
      }
      if (period.year !== currentYear) {
        throw new Error(`Solo se permiten meses del año en curso (${currentYear})`);
      }
      if (period.month > now.month) {
        throw new Error(`No se pueden consultar meses futuros (mes actual: ${now.month})`);
      }
      const monthStart = DateTime.fromObject(
        { year: period.year, month: period.month, day: 1 },
        { zone: CONFIG.TIMEZONE }
      );
      dateFrom = monthStart.startOf("day");
      dateTo =
        period.year === currentYear && period.month === now.month
          ? now.endOf("day")
          : monthStart.endOf("month").endOf("day");
      break;
    }
    case "year": {
      if (!Number.isInteger(period.year)) {
        throw new Error("El año debe ser un número entero");
      }
      if (period.year !== currentYear && period.year !== previousYear) {
        throw new Error(
          `Solo se permiten el año en curso (${currentYear}) o el año anterior (${previousYear})`
        );
      }
      dateFrom = DateTime.fromObject(
        { year: period.year, month: 1, day: 1 },
        { zone: CONFIG.TIMEZONE }
      ).startOf("day");
      dateTo =
        period.year === currentYear
          ? now.endOf("day")
          : DateTime.fromObject(
              { year: period.year, month: 12, day: 31 },
              { zone: CONFIG.TIMEZONE }
            ).endOf("day");
      break;
    }
  }

  return {
    frenteNombre: frente.trim(),
    dateFrom: dateFrom.toUTC().toJSDate(),
    dateTo: dateTo.toUTC().toJSDate(),
  };
}

export function periodIncludesToday(period: DashboardPeriod): boolean {
  const now = DateTime.now().setZone(CONFIG.TIMEZONE);
  switch (period.type) {
    case "week": {
      const weekStart = DateTime.fromISO(period.weekStart, { zone: CONFIG.TIMEZONE });
      const weekEnd = weekStart.plus({ days: 6 });
      return now >= weekStart && now <= weekEnd;
    }
    case "month": return period.year === now.year && period.month === now.month;
    case "year":  return period.year === now.year;
  }
}
