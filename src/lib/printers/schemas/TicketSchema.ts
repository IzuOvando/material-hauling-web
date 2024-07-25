import { Ticket } from "@/types";

export default interface TicketSchema {
  generateTicket: (
    writter: any,
    ticket: Ticket,
    original: boolean,
    frente: string
  ) => void;
}
