import { TicketPrinter } from "@/lib/printers";

export type Printer = {
  name: string;
  ip: string;
  status: "online" | "offline" | "connecting";
  device?: TicketPrinter;
};


export type Frente = {
  nombre: string;
  tickets: Ticket[];
};

export type Ticket = {
  uuid: string;
  empresa: string;
  material: string;
  cubicacion: string;
  fecha: string;
  placas: string;
  noEmpleado: string;
  idCamion: string;
  operador: string;
  checador: string;
  hora: string;
  proyecto: string;
  banco: string;
  createdAt: Date;
  frenteNombre: string;
  frente?: Frente;
};