import type { ReactNode } from "react";
import { TicketPrinter } from "@/lib/printers";
import { Acarreos, Gasolina, Concreto, VoucherCamion, Asfalto } from "@prisma/client";

export type Printer = {
  name: string;
  ip: string;
  status: "online" | "offline" | "connecting" | "paperEnd";
  device?: TicketPrinter;
};

export type FacetedFilter = {
  field: keyof Acarreos | keyof Gasolina | keyof Concreto | keyof VoucherCamion | keyof Asfalto;
  options: {
    value: string;
    count: number;
  }[];
};

export type Ticket = Acarreos | Gasolina | Concreto | VoucherCamion |Asfalto;

export type DatasetKey =
  | "gasolina"
  | "acarreos"
  | "concreto"
  | "vouchercamion"
  | "asfalto";

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