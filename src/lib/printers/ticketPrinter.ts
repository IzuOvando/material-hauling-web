"use client";
import { Ticket } from "@prisma/client";
import EpsonPrinter from "./epson";
import { findClosestMatch } from "@/helpers/strings";

const setPrintableMetanames = (metanames: string[], maxLenght: number) => {
  return metanames.map((metaname) => ({
    normal: metaname,
    printable: `${metaname}:\t`.toUpperCase().padStart(maxLenght, " "),
  }));
};

export default class TicketPrinter extends EpsonPrinter {
  private static METANAMES = [
    "fecha",
    "hora",
    "material",
    "cubicacion",
    "banco",
    "idCamion",
    "placas",
    "operador",
    "noEmpleado",
    "checador",
  ];
  private static MAX_LENGTH_METANAME = 11;
  private static PRINT_METANAMES = setPrintableMetanames(
    TicketPrinter.METANAMES,
    TicketPrinter.MAX_LENGTH_METANAME
  );
  private static CLIENT_METANAME = `CLIENTE:\t`.padStart(
    TicketPrinter.MAX_LENGTH_METANAME,
    " "
  );

  public printTicket = (
    ticket: Ticket,
    original: boolean = true,
    id: string,
    frente: string
  ) => {
    let { writter, sender } = this.createPrint();

    console.debug(`Printing ticket ${ticket.uuid}...`);

    this.configTicket(writter);
    this.generateTicket(writter, ticket, original, frente);
    this.finishTicket(writter);

    sender(writter.toString(), id);
  };

  private generateTicket = (
    writter: any,
    ticket: Ticket,
    original: boolean,
    frente: string
  ) => {
    this.addEnterpriseLogo(writter, ticket.empresa);
    this.addId(writter, ticket.uuid);
    this.addFrente(writter, frente);
    this.addTicketData(writter, ticket);
    this.addTypeTicket(writter, original);
    this.addProyect(writter, ticket.proyecto);
    this.addQR(writter, `${ticket.uuid}`);
  };

  private configTicket = (writter: any) => {
    writter.addTextLang("es").addTextSize(1, 1).addTextSmooth(true);
  };

  private addEnterpriseLogo = (writter: any, enterprise: string) => {
    const imageKey = findClosestMatch(
      enterprise,
      window.enterprises.imagesNames
    );

    try {
      const image =
        window.enterprises.images[imageKey != null ? imageKey : "sedena"];

      writter
        .addTextAlign(writter.ALIGN_CENTER)
        .addImage(image.context, 0, 0, image.canvas.width, image.canvas.height)
        .addFeedLine(1);
    } catch (error) {
      console.error("Error loading enterprise logo:", error);
    }
  };

  private addId = (writter: any, id: string) => {
    writter
      .addTextAlign(writter.ALIGN_RIGHT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("FOLIO:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${id}\n`);
  };

  private addFrente = (writter: any, frente: string) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText(TicketPrinter.CLIENT_METANAME)
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`SEDENA ${frente}\n`);
  };

  private addTicketData = (writter: any, ticket: Ticket) => {
    for (const metaname of TicketPrinter.PRINT_METANAMES) {
      writter
        .addTextStyle(false, false, true, writter.COLOR_1)
        .addText(metaname.printable)
        .addTextStyle(false, false, false, writter.COLOR_1);

      const key = metaname.normal as keyof typeof ticket;
      writter.addText(`${ticket[key]}\n`);
    }
  };

  private addTypeTicket = (writter: any, original: boolean) => {
    writter
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addFeedLine(1)
      .addText(original ? "O-R-I-G-I-N-A-L\n" : "C-O-P-I-A\n");
  };

  private addProyect = (writter: any, proyect: string) => {
    writter.addText(`${proyect}`);
  };

  private addQR = (writter: any, data: string) => {
    writter.addFeedLine(1);
    writter.addSymbol(data, writter.SYMBOL_QRCODE_MODEL_2, writter.LEVEL_Q, 5);
  };

  private finishTicket = (writter: any) => {
    writter.addFeedLine(2).addCut(writter.CUT_FEED);
  };
}
