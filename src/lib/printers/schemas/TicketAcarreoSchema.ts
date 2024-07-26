import { setPrintableMetanames } from "./helpers";
import TicketSchema from "./TicketSchema";
import { Ticket } from "@/types";
import { findClosestMatch } from "@/helpers/strings";
import { Acarreos } from "@prisma/client";

export default class TicketAcarreoSchema implements TicketSchema {
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
    TicketAcarreoSchema.METANAMES,
    TicketAcarreoSchema.MAX_LENGTH_METANAME
  );
  private static CLIENT_METANAME = `CLIENTE:\t`.padStart(
    TicketAcarreoSchema.MAX_LENGTH_METANAME,
    " "
  );

  public generateTicket = (
    writter: any,
    ticket: Ticket,
    original: boolean,
    frente: string
  ) => {
    const ticketAcarreo = ticket as Acarreos;
    this.addEnterpriseLogo(writter, ticketAcarreo.empresa);
    this.addId(writter, ticketAcarreo.folio);
    this.addFrente(writter, frente);
    this.addTicketData(writter, ticketAcarreo);
    this.addTypeTicket(writter, original);
    this.addProyect(writter, ticketAcarreo.proyecto);
    this.addQR(writter, `${ticketAcarreo.uuid}`);
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
      .addText(TicketAcarreoSchema.CLIENT_METANAME)
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`SEDENA ${frente}\n`);
  };

  private addTicketData = (writter: any, ticket: Acarreos) => {
    for (const metaname of TicketAcarreoSchema.PRINT_METANAMES) {
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
}
