import { TicketPrinter } from "@/lib/printers";
import { Acarreos, Gasolina } from "@prisma/client";

export type Printer = {
  name: string;
  ip: string;
  status: "online" | "offline" | "connecting" | "paperEnd";
  device?: TicketPrinter;
};

export type FacetedFilter = {
  field: keyof Acarreos | keyof Gasolina;
  options: string[];
};

export type Ticket = Acarreos | Gasolina;
