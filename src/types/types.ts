import type { ReactNode } from "react";
import { VoucherCamion } from "@prisma/client";

export type FacetedFilter = {
  field: keyof VoucherCamion;
  options: {
    value: string;
    count: number;
  }[];
};

export type Ticket = VoucherCamion;

export type DatasetKey = "vouchercamion";

export type TransformFn = (value: any, record: any) => any;

export type DatasetConfig = {
  headerMap?: Record<string, string>;
  transforms?: Record<string, TransformFn>;
};

// ─── Users / Stepper ─────────────────────────────────────────────────────────

export type StepId = 1 | 2 | 3;

export interface StepMeta {
  id: StepId;
  label: string;
  icon: ReactNode;
}

export interface UserRow {
  username: string;
  rol: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string | null;
  noEmpleado: string;
  frentes: string[];
}