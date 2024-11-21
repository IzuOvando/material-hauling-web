import { TicketPrinter } from "@/lib/printers";
import { Acarreos, Gasolina, Concreto } from "@prisma/client";

export type Printer = {
  name: string;
  ip: string;
  status: "online" | "offline" | "connecting" | "paperEnd";
  device?: TicketPrinter;
};

export type FacetedFilter = {
  field: keyof Acarreos | keyof Gasolina | keyof Concreto;
  options: {
    value: string;
    count: number;
  }[];
};

export type Ticket = Acarreos | Gasolina | Concreto;
