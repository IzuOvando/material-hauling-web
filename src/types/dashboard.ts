export type DashboardPeriod = "today" | "yesterday" | "week" | "month";

export interface DashboardFilters {
  frenteNombre: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface SummaryResponse {
  totalTrips: number;
  totalM3: number;
  avgM3PerTrip: number;
  activeTrucks: number;
  activeOperators: number;
  topMaterial: string | null;
  topDestino: string | null;
}

export interface TimeseriesPoint {
  date: string;
  trips: number;
  m3: number;
}

export interface BreakdownItem {
  label: string;
  trips: number;
  m3: number;
}
