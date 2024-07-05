import { TicketPrinter } from "@/lib/printers";

export type Printer = {
  name: string;
  ip: string;
  status: "online" | "offline" | "connecting";
  device?: TicketPrinter;
};
