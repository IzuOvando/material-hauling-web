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
    this.addMetaInfo(writter, ticketConcreto);
    this.addMetaConcretoInfo(writter, ticketConcreto);
    this.addConcretoInfo(writter, ticketConcreto);
    this.addTruckInfo(writter, ticketConcreto);
    this.addTimeInfo(writter, ticketConcreto);
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
      .addFeedLine(2);
  };

  private addMetaInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("FECHA: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${formatIsoDateFromString(ticket.fecha as any)}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("FOLIO: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.uuid}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("PLANTA: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.planta}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("CLIENTE: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.cliente}\n`)
      .addFeedLine(1);
  };

  private addMetaConcretoInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("DESTINO: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.destino}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("ELEMENTO: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.elemento}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("USO: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.uso}\n`)
      .addFeedLine(1);
  };

  private addConcretoInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("F'C: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.fc}\t`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("VOLUMEN: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.cubicacion} m³\t`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("REV: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.rev} cm\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("T°CONCRETO: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.tempConcreto} °C\t`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("T°AMBIENTE: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.tempAmbiente} °C\n`)
      .addFeedLine(1);
  };

  private addTruckInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("NO.ECONOMICO: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.noEconomico}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("MARCA: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.marca}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("PLACA: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.placas}\n`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("OPERADOR: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${ticket.operador}\n`)
      .addFeedLine(1);
  };

  private addTimeInfo = (writter: any, ticket: Concreto) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("HRSALIDA: ")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`${formatTime12HourFromString(ticket.horaSalida as any)}\t`)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("HRLLEGADA: \t\t\n")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addFeedLine(1);
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
