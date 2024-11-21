import TicketSchema from "./TicketSchema";
import { Concreto } from "@prisma/client";
import { Ticket } from "@/types";
import {
  formatIsoDateFromString,
  formatTime12HourFromString,
} from "@/helpers/formatters/datetime";
import { findClosestMatch } from "@/helpers/strings";

export default class TicketConcretoSchema implements TicketSchema {
  public generateTicket = (
    writter: any,
    ticket: Ticket,
    original: boolean,
    frente: string
  ) => {
    const ticketConcreto = ticket as Concreto;
    this.addEnterpriseLogo(writter, ticketConcreto.empresa);
    this.addEnterpriseName(writter, ticketConcreto.empresa);
    this.addId(writter, ticketConcreto.uuid);
    this.addCliente(writter, ticketConcreto.cliente);
    this.addTimeInfo(writter, ticketConcreto);
    this.addTicketInfo(writter, ticketConcreto);
    this.addTypeTicket(writter, original);
    this.addQR(writter, `${ticketConcreto.uuid}`);
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

  private addEnterpriseName = (writter: any, enterprise: string) => {
    writter
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText(enterprise)
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addFeedLine(1);
  };

  private addId = (writter: any, id: string) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("  FOLIO:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${id}\n`);
  };

  private addCliente = (writter: any, cliente: string) => {
    writter
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("CLIENTE:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${cliente}\n`)
      .addFeedLine(1);
  };

  private addTimeInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("    FECHA:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${formatIsoDateFromString(ticket.fecha as any)}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText(" HRSALIDA:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${formatTime12HourFromString(ticket.horaSalida as any)}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("HRLLEGADA:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${formatTime12HourFromString(ticket.horaLlegada as any)}\n`)
      .addFeedLine(1);
  };

  private addTicketInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("      PLANTA:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.planta}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("   NO.PLANTA:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.noPlanta}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("   UBICACION:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.ubicacion}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("NO.ECONOMICO:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.noEconomico}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("    OPERADOR:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.operador}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("         F'C:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.fc}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("         REV:\t cm")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.rev}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("  T°CONCRETO:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.tempConcreto} °C\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("  T°AMBIENTE:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.tempAmbiente} °C\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("  CUBICACION:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.cubicacion} m³\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("    ELEMENTO:\t")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.elemento}\n`);
  };

  private addTypeTicket = (writter: any, original: boolean) => {
    writter
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addFeedLine(1)
      .addText(original ? "O-R-I-G-I-N-A-L\n" : "C-O-P-I-A\n");
  };

  private addQR = (writter: any, data: string) => {
    writter.addFeedLine(1);
    writter.addSymbol(data, writter.SYMBOL_QRCODE_MODEL_2, writter.LEVEL_Q, 5);
  };
}
