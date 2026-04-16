"use client";
import EpsonPrinter from "./epson";
import { TicketArea, Ticket } from "@/types";
import {
  TicketSchema,
  TicketAcarreoSchema,
  TicketGasolinaSchema,
  TicketConcretoSchema,
  TicketAsfaltoSchema,
} from "./schemas";

export default class TicketPrinter extends EpsonPrinter {
  private schema: TicketSchema = new TicketAcarreoSchema();

  public setArea = (area: TicketArea) => {
    if (area === TicketArea.ACARREOS) this.schema = new TicketAcarreoSchema();
    else if (area === TicketArea.GASOLINA)
      this.schema = new TicketGasolinaSchema();
    else if (area === TicketArea.ASFALTO)
      this.schema = new TicketAsfaltoSchema();
    else this.schema = new TicketConcretoSchema();
  };

  public printTicket = (
    ticket: Ticket,
    original: boolean = true,
    id: string,
    frente: string
  ) => {
    let { writter, sender } = this.createPrint();

    console.debug(`Printing ticket ${(ticket as { uuid?: string; folio?: string }).uuid ?? (ticket as { folio?: string }).folio}...`);

    this.configTicket(writter);
    this.schema.generateTicket(writter, ticket, original, frente);
    this.finishTicket(writter);

    sender(writter.toString(), id);
  };

  private configTicket = (writter: any) => {
    writter.addTextLang("es").addTextSize(1, 1).addTextSmooth(true);
  };

  private finishTicket = (writter: any) => {
    writter.addFeedLine(2).addCut(writter.CUT_FEED);
  };
}
