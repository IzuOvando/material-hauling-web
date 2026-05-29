export type DashboardPeriod =
  | { type: "week";  weekStart: string }
  | { type: "month"; year: number; month: number }
  | { type: "year";  year: number };

export interface DashboardFilters {
  frenteNombre: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface SummaryResponse {
  totalTrips: number;
  totalM3: number;
  avgM3PerTrip: number;
  arrivalRate: number;
  turno1Arrived: number;
  turno2Arrived: number;
}

export interface ActiveResponse {
  inTransitNow: number;
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

// TODO (SDN-141): add "origen" and "destino" to this allowlist when the module is ready
export const ALLOWED_GROUP_BY = ["material", "checkerName"] as const;
export type BreakdownGroupBy = (typeof ALLOWED_GROUP_BY)[number];
