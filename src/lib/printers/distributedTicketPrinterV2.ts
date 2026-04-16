import { Printer, Ticket, TicketArea } from "@/types";
import { Queue } from "@/helpers/structures";

export enum DistributedPrinterStatus {
  NOT_PRINTING = -1,
  PRINTING = 0,
  WAITING_START_PRINTING_ERRORED = 1,
  FINISHED = 2,
}

export default class DistributedTicketPrinter {
  private printers: Map<string, PrinterWithBuffer>;
  private failedPrintersNames: Set<string>;
  private printingQueue: Queue<Ticket>;
  private successfulPrints: Set<string>;
  private failedPrints: Set<Ticket>;
  private status: DistributedPrinterStatus;
  private onPrintEvent: (
    ticketsPrinted: number,
    failedPrintersNames: Set<string>,
    status: DistributedPrinterStatus,
    ticketsFailed: number
  ) => void;

  public constructor(
    printers: Printer[],
    ticketsToPrint: Ticket[],
    onPrintEvent: (
      ticketsPrinted: number,
      failedPrintersNames: Set<string>,
      status: DistributedPrinterStatus,
      ticketsFailed: number
    ) => void,
    metadata: {
      frente: string;
      area: TicketArea;
    }
  ) {
    // Config printers
    this.printers = new Map();
    this.failedPrintersNames = new Set();
    printers.forEach((printer) => {
      printer.device?.setArea(metadata.area);
      this.printers.set(
        printer.name,
        new PrinterWithBuffer(
          printer,
          metadata,
          this.handlePrintSuccess.bind(this),
          this.handlePrintError.bind(this)
        )
      );
    });
    // Init prints status variables
    this.printingQueue = Queue.fromArray(ticketsToPrint);
    this.successfulPrints = new Set();
    this.failedPrints = new Set();
    this.status = DistributedPrinterStatus.NOT_PRINTING;
    // Init callbacks
    this.onPrintEvent = onPrintEvent;
  }

  public startPrinting(errored?: boolean) {
    if (errored) {
      this.printingQueue = Queue.fromSet(this.failedPrints);
      this.failedPrints = new Set();
    }
    if (this.printingQueue.isEmpty()) {
      this.status = DistributedPrinterStatus.FINISHED;
      return;
    }

    this.status = DistributedPrinterStatus.PRINTING;
    this.printers.forEach((printer) => this.printNextTicket(printer));
  }

  public reincludeFailedPrinter(printerName: string) {
    this.failedPrintersNames.delete(printerName);
    const printer = this.printers.get(printerName);
    if (printer) this.printNextTicket(printer);
  }

  private printNextTicket(printer: PrinterWithBuffer) {
    const ticket = this.printingQueue.dequeue();
    if (!ticket) {
      console.warn("No more tickets to print.");
      return;
    }

    printer.print(ticket);
  }

  private handlePrintSuccess(uuid: string, printer: PrinterWithBuffer) {
    this.successfulPrints.add(uuid);
    if (this.printingQueue.isEmpty()) {
      this.status =
        this.failedPrints.size === 0
          ? DistributedPrinterStatus.FINISHED
          : DistributedPrinterStatus.WAITING_START_PRINTING_ERRORED;
    } else {
      this.printNextTicket(printer);
    }

    this.onPrintEvent(
      this.successfulPrints.size,
      this.failedPrintersNames,
      this.status,
      this.failedPrints.size
    );
  }

  private handlePrintError(ticket: Ticket, printer: PrinterWithBuffer) {
    this.failedPrints.add(ticket);
    if (this.printingQueue.isEmpty())
      this.status = DistributedPrinterStatus.WAITING_START_PRINTING_ERRORED;
    this.failedPrintersNames.add(printer.printer.name);

    this.onPrintEvent(
      this.successfulPrints.size,
      this.failedPrintersNames,
      this.status,
      this.failedPrints.size
    );
  }
}

class PrinterWithBuffer {
  public printer: Printer;
  private buffer: Ticket | null;
  private status: {
    original: boolean;
    copy: boolean;
  };
  private metadata: {
    frente: string;
    area: TicketArea;
  };
  private onSuccess: (uuid: string, printer: PrinterWithBuffer) => void;
  private onError: (ticket: Ticket, printer: PrinterWithBuffer) => void;

  public constructor(
    printer: Printer,
    metadata: { frente: string; area: TicketArea },
    onSuccess: (uuid: string, printer: PrinterWithBuffer) => void,
    onError: (ticket: Ticket, printer: PrinterWithBuffer) => void
  ) {
    // Config printer
    this.printer = printer;
    this.printer.device?.setHandlePrintResponse(
      this.handlePrinterResponse.bind(this)
    );
    this.printer.device?.setHandleDisconnect(
      this.handlePrinterDisconnection.bind(this)
    );
    // Config init buffer
    this.buffer = null;
    this.status = { original: false, copy: false };
    this.metadata = metadata;
    // Config callbacks
    this.onSuccess = onSuccess;
    this.onError = onError;
  }

  public print(ticket: Ticket) {
    this.buffer = ticket;
    this.status = { original: false, copy: false };

    this.printer.device?.printTicket(
      ticket,
      true,
      "original",
      this.metadata.frente
    );
    this.printer.device?.printTicket(
      ticket,
      false,
      "copy",
      this.metadata.frente
    );
  }

  private handlePrinterResponse(
    printJobId: string,
    success: boolean,
    code: string,
    warning: string
  ) {
    if (!this.buffer) return;

    if (success) {
      // Check which print job was completed
      if (printJobId === "original") {
        this.status.original = true;
        console.debug(`Printed original ticket for ${(this.buffer as { uuid?: string; folio?: string } | undefined)?.uuid ?? (this.buffer as { folio?: string } | undefined)?.folio}`);
      } else {
        this.status.copy = true;
        console.debug(`Printed copy ticket for ${(this.buffer as { uuid?: string; folio?: string } | undefined)?.uuid ?? (this.buffer as { folio?: string } | undefined)?.folio}`);
      }
      // Check if both print jobs were completed
      if (this.status.original && this.status.copy) {
        this.status = { original: false, copy: false };
        this.onSuccess(((this.buffer as { uuid?: string; folio?: string } | undefined)?.uuid ?? (this.buffer as { folio?: string } | undefined)?.folio) ?? '', this);
      }
    } else {
      // All print job failed as error
      this.onError(this.buffer, this);
    }
  }

  private handlePrinterDisconnection() {
    console.debug(`Printer ${this.printer.name} disconnected.`);
    if (this.buffer) this.onError(this.buffer, this);
    this.buffer = null;
  }
}
