export type PeriodPreset = "yesterday" | "today" | "last7" | "thisMonth" | "custom";

export type StatusValue = "ALL" | "IN_TRANSIT" | "ARRIVED";

export type TurnoValue = "ALL" | "1" | "2";

export type VoucherView = "cards" | "table";

export interface TrucksFilterState {
  period: PeriodPreset;
  range: { from: string; to: string } | null;
  status: StatusValue;
  q: string;
  material: string[];
  checkerName: string[];
  arrivalCheckerName: string[];
  turno: TurnoValue;
  frenteNombre: string[];
}

export interface TrucksFacets {
  material: { value: string; count: number }[];
  checkerName: { value: string; count: number }[];
  arrivalCheckerName: { value: string; count: number }[];
  frenteNombre: { value: string; count: number }[];
}
