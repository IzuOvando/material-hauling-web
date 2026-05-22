import { DateTime } from "luxon";
import CONFIG from "@/config";
import type { DashboardFilters } from "@/types/dashboard";

const MAX_RANGE_DAYS = 31;

export function getDashboardFilters(
  frente: string,
  dateFrom: string,
  dateTo: string
): DashboardFilters {
  if (!frente || frente.trim() === "") {
    throw new Error("El frente no puede estar vacío");
  }

  const from = DateTime.fromISO(dateFrom, { zone: CONFIG.TIMEZONE });
  const to = DateTime.fromISO(dateTo, { zone: CONFIG.TIMEZONE });

  if (!from.isValid) {
    throw new Error(`Fecha de inicio inválida: ${dateFrom}`);
  }

  if (!to.isValid) {
    throw new Error(`Fecha de fin inválida: ${dateTo}`);
  }

  if (from > to) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
  }

  const rangeDays = to.diff(from, "days").days;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw new Error(`El rango no puede superar ${MAX_RANGE_DAYS} días`);
  }

  return {
    frenteNombre: frente.trim(),
    dateFrom: from.startOf("day").toUTC().toJSDate(),
    dateTo: to.endOf("day").toUTC().toJSDate(),
  };
}
