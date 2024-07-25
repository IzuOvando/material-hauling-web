import { Printer, Ticket, TicketArea } from "@/types";
import { divideArray } from "@/helpers/arrays";
import { generateUniqueId } from "@/helpers/strings";

type TicketWithId = {
  ticket: Ticket;
  id: string;
  original: boolean;
};

export default class DistributedPrinter {
  private static MAX_BUFFER_SIZE = 2;
  private printers: PrinterWithBuffer[];
  private failedPrinters: PrinterWithBuffer[];
  private ticketsToPrint: TicketWithId[]; // UUIDs of tickets to be printed
  private onPrinterFailed: (printer: string) => void;
  private onTicketPrinted: () => void;

  public constructor(
    printers: Printer[],
    ticketsToPrint: Ticket[],
    onPrinterFailed: (printer: string) => void,
    onTicketPrinted: () => void,
    frente: string,
    area: TicketArea
  ) {
    this.ticketsToPrint = [];
    this.printers = [];
    this.failedPrinters = [];

    ticketsToPrint.forEach((ticket) => {
      this.ticketsToPrint.push({
        ticket,
        id: generateUniqueId(30),
        original: true,
      });
      this.ticketsToPrint.push({
        ticket,
        id: generateUniqueId(30),
        original: false,
      });
    });

    const initialTickets = this.ticketsToPrint.splice(
      0,
      DistributedPrinter.MAX_BUFFER_SIZE * printers.length
    );
    const initialBuffers = divideArray(initialTickets, printers.length);
    for (let i = 0; i < printers.length; i++) {
      printers[i].device?.setArea(area);
      this.printers.push(
        new PrinterWithBuffer(
          printers[i],
          this.distributeTickets.bind(this),
          this.handleOnTicketPrinted.bind(this),
          this.handleOnTicketFailed.bind(this),
          initialBuffers[i],
          frente
        )
      );
    }

    this.onPrinterFailed = onPrinterFailed;
    this.onTicketPrinted = onTicketPrinted;
  }

  public startPrinting() {
    if (this.printers.length === 0) {
      console.warn("No printers available.");
      return;
    }
    this.printers.forEach((printer) => printer.printTickets());
  }

  private distributeTickets() {
    return this.ticketsToPrint.splice(0, DistributedPrinter.MAX_BUFFER_SIZE);
  }

  private handleOnTicketPrinted(uuid: string) {
    console.debug(`Ticket ${uuid} printed successfully.`);
    this.onTicketPrinted();
  }

  private handleOnTicketFailed(
    ticket: TicketWithId,
    error: string,
    printer: PrinterWithBuffer
  ) {
    console.error(
      `Error printing ticket ${ticket.ticket.uuid} ${
        ticket.original ? "original" : "copy"
      } on ${printer.printer.name}: ${error}`
    );
    this.ticketsToPrint.push(ticket);

    const printerIndex = this.printers.findIndex(
      (printerOnArray) => printerOnArray.printer.name === printer.printer.name
    );

    if (printerIndex >= 0) {
      const failedPrinter = this.printers[printerIndex];
      this.failedPrinters.push(failedPrinter);
      this.printers.splice(printerIndex, 1);
      // Callback to notify the caller about the failed printer
      this.onPrinterFailed(failedPrinter.printer.name);
    }
  }

  public retryFailedPrinters() {
    for (const failedPrinter of this.failedPrinters) {
      this.printers.push(failedPrinter);
      failedPrinter.printer.device?.reconnect();
      setTimeout(() => {
        failedPrinter.printer.device?.printTest();
        failedPrinter.continuePrinting();
      }, 2000);
    }

    this.failedPrinters = [];
  }
}

class PrinterWithBuffer {
  public printer: Printer;
  private buffer: TicketWithId[];
  private getMoreTickets: () => TicketWithId[];
  private onTicketPrinted: (uuid: string) => void;
  private onTicketFailed: (
    ticket: TicketWithId,
    error: string,
    printer: PrinterWithBuffer
  ) => void;
  private frente: string;

  public constructor(
    printer: Printer,
    getMoreTickets: () => TicketWithId[],
    onTicketPrinted: (uuid: string) => void,
    onTicketFailed: (
      ticket: TicketWithId,
      error: string,
      printer: PrinterWithBuffer
    ) => void,
    startBuffer: TicketWithId[] = [],
    frente: string
  ) {
    this.printer = printer;
    this.buffer = startBuffer;
    this.getMoreTickets = getMoreTickets;
    this.frente = frente;
    if (this.printer.device)
      this.printer.device.setHandlePrintResponse(
        this.handlePrintResponse.bind(this)
      );
    this.onTicketPrinted = onTicketPrinted;
    this.onTicketFailed = onTicketFailed;
  }

  private fillBuffer() {
    const tickets = this.getMoreTickets();
    this.buffer = this.buffer.concat(tickets);
  }

  public printTickets() {
    for (const ticket of this.buffer) {
      if (this.printer.device)
        this.printer.device.printTicket(
          ticket.ticket,
          ticket.original,
          ticket.id,
          this.frente
        );
    }
  }

  public continuePrinting() {
    console.debug(`Continuing printing for ${this.printer.name}`);
    this.fillBuffer();
    if (this.buffer.length === 0) {
      return;
    }
    this.printTickets();
  }

  private handlePrintResponse(
    printJobId: string,
    success: boolean,
    code: string,
    warning: string
  ) {
    try {
      if (warning) console.warn(`Warning: ${warning}`);

      const ticketIndex = this.buffer.findIndex(
        (ticket) => ticket.id === printJobId
      );
      const ticket = this.buffer[ticketIndex];

      this.buffer.splice(ticketIndex, 1); // Remove ticket from buffer

      if (success) {
        this.onTicketPrinted(ticket.ticket.uuid);
        // Check if we need to fill the buffer again
        if (this.buffer.length === 0) this.continuePrinting();
      } else {
        this.onTicketFailed(ticket, code, this);
      }
    } catch (error) {
      console.error(`Critical error handling print response: ${error}`);
    }
  }
}
