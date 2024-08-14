import TicketSchema from "./TicketSchema";
import { Gasolina } from "@prisma/client";
import { Ticket } from "@/types";
import { formatPrice, formatVolume } from "@/helpers/formatters/numbers";
import {
  formatIsoDateFromString,
  formatTime12HourFromString,
} from "@/helpers/formatters/datetime";
export default class TicketAcarreoSchema implements TicketSchema {
  public generateTicket = (
    writter: any,
    ticket: Ticket,
    original: boolean,
    frente: string
  ) => {
    const ticketGas = ticket as Gasolina;
    this.addEnterpriseLogo(writter);
    this.addEnterpriseInfo(writter, ticketGas);
    this.addTypeTicket(writter, original);
    this.addGasolinaInfo(writter, ticketGas);
    this.addGasolinaExtraInfo(writter, ticketGas, frente);
    this.addThanks(writter);
    this.addWeb(writter);
  };

  private addEnterpriseLogo = (writter: any) => {
    try {
      // ! For now hardcoded FullGas Logo
      const image = window.enterprises.images.fullgas;
      writter
        .addTextAlign(writter.ALIGN_CENTER)
        .addImage(image.context, 0, 0, image.canvas.width, image.canvas.height)
        .addFeedLine(1);
    } catch (error) {
      console.error("Error loading enterprise logo:", error);
    }
  };

  private addEnterpriseInfo = (writter: any, ticket: Gasolina) => {
    writter
      .addText("FULLGAS CARRILLO\n")
      .addText("PL/20284/EXP/ES/2017\n")
      .addText("SERVICIOS ECOLOGICOS\n")
      .addText("MAYAPAN S.A DE C.V\n")
      .addText("CEL: 9993772451\n")
      .addText("RFC: SEM141031V5A\n")
      .addText("SIC: 0000113435\n")
      .addText("MATRIZ: \n")
      .addText("CORREO: CARRILLOPUERTO@FULLGAS.COM.MX\n")
      .addText("ESTACION: 13435\n")
      .addText("TERMINAL: 1343500002\n")
      .addText("AV. BENITO JUAREZ POR CALLE 79 #881\n")
      .addText("JESUS MARTINEZ ROSS FELIPE CARRILLO\n")
      .addText("PUERTO QUINTANA ROO CP. 77220\n");
  };

  private addTypeTicket = (writter: any, original: boolean) => {
    writter
      .addFeedLine(1)
      .addTextSize(2, 2)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText(original ? "ORIGINAL VENTA\n" : "COPIA VENTA\n")
      .addFeedLine(1)
      .addTextSize(1, 1);
  };

  private addGasolinaInfo = (writter: any, ticket: Gasolina) => {
    writter
      .addText("------------------------------------------\n")
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addTextAlign(writter.ALIGN_LEFT)
      .addText(`FORMA DE PAGO:\t${ticket.formatoPago}\n`)
      .addText(`COMBUSTIBLE:\t 32011 PEMEX MAGNA\n`)
      .addText(`PRECIO UNITARIO:\t${formatPrice(ticket.precioUnitario)}\n`)
      .addText(`LITROS:\t ${formatVolume(ticket.litros, false, true)}\n`)
      .addText(`TOTAL:\t${formatPrice(ticket.total)}\n`)
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("------------------------------------------\n");
  };

  private addGasolinaExtraInfo = (
    writter: any,
    ticket: Gasolina,
    frente: string
  ) => {
    writter
      .addTextAlign(writter.ALIGN_LEFT)
      .addTextStyle(false, false, false, writter.COLOR_1)
      .addText(`Folio:\t${ticket.folio}\n`)
      .addText(`Autorización:\t*****${ticket.autorizacion}*****\n`)
      .addText(`Nombre:\tSEDENA ${frente}\n`)
      .addText("Cuenta:\t5892274\n")
      .addText(`Bomba:\t${ticket.bomba}\n`)
      .addText(`Placas:\t${ticket.placas}\n`)
      .addText(`Saldo próxima compra:\t${formatPrice(ticket.saldoCompra)}\n`)
      .addText(
        `Fecha y Hora:\t${formatIsoDateFromString(
          ticket.fecha as any
        )} ${formatTime12HourFromString(ticket.hora as any)}\n`
      );
  };

  private addThanks(writter: any) {
    writter
      .addFeedLine(1)
      .addTextAlign(writter.ALIGN_CENTER)
      .addTextSize(2, 2)
      .addTextStyle(false, false, true, writter.COLOR_1)
      .addText("¡GRACIAS POR SU COMPRA!\n");
  }

  private addWeb(writter: any) {
    try {
      // ! For now hardcoded FullGas Logo
      const image = window.enterprises.images.web_fullgas;
      writter
        .addTextAlign(writter.ALIGN_LEFT)
        .addFeedLine(1)
        .addImage(image.context, 0, 0, image.canvas.width, image.canvas.height)
        .addFeedLine(1);
    } catch (error) {
      console.error("Error loading enterprise logo:", error);
      writter.addText("\nFULLGAS.COM.MX\n");
    }
  }
}
