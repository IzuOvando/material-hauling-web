"use client";
import { Ticket } from "@prisma/client";
import EpsonPrinter from "./epson";
import CONFIG from "@/config";
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
    "empresa",
    "banco",
    "idCamion",
    "placas",
    "operador",
    "noEmpleado",
    "checador",
  ];
  private static PRINT_METANAMES = setPrintableMetanames(
    TicketPrinter.METANAMES,
    11
  );

  public printTicket = (ticket: Ticket) => {
    let { writter, sender } = this.createPrint();

    console.debug(`Printing ticket ${ticket.uuid}...`);

    this.configTicket(writter);
    this.generateTicket(writter, ticket);
    this.finishTicket(writter);

    sender(writter.toString(), ticket.uuid.slice(0, 30));
  };

  private generateTicket = (writter: any, ticket: Ticket) => {
    this.addEnterpriseLogo(writter, ticket.empresa);
    this.addId(writter, ticket.uuid);
    this.addTicketData(writter, ticket);
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

  private addTicketData = (writter: any, ticket: Ticket) => {
    writter.addTextAlign(writter.ALIGN_LEFT);

    for (const metaname of TicketPrinter.PRINT_METANAMES) {
      writter
        .addTextStyle(false, false, true, writter.COLOR_1)
        .addText(metaname.printable)
        .addTextStyle(false, false, false, writter.COLOR_1);

      const key = metaname.normal as keyof typeof ticket;
      writter.addText(`${ticket[key]}\n`);
    }
  };

  private addProyect = (writter: any, proyect: string) => {
    writter
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addFeedLine(1)
      .addText(`"${proyect}`);
  };

  private addQR = (writter: any, data: string) => {
    writter.addFeedLine(1);
    writter.addSymbol(data, writter.SYMBOL_QRCODE_MODEL_2, writter.LEVEL_Q, 5);
  };

  private finishTicket = (writter: any) => {
    writter.addFeedLine(2).addCut(writter.CUT_FEED);
  };
}
