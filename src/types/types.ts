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
