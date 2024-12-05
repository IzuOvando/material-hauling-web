import { VoucherCamion } from "@prisma/client";
import pako from "pako";
import { Buffer } from "buffer";

class DataCompressor {
  private static fieldMap: { [key: number]: keyof VoucherCamion } = {
    1: "uuid",
    2: "tiro",
    3: "voucherTime",
    4: "origen",
    5: "material",
    6: "placas",
    7: "operador",
    8: "turno",
    9: "empresa",
    10: "cubicacion",
    11: "noEmpleado",
    12: "idCamion",
    13: "checkerName",
    14: "checkerNo",
  };

  public static compressTicketData(ticket: VoucherCamion): string {
    const ticketCompacto = {
      1: ticket.uuid,
      2: ticket.tiro,
      3: ticket.voucherTime,
      4: ticket.origen,
      5: ticket.material,
      6: ticket.placas,
      7: ticket.operador,
      8: ticket.turno,
      9: ticket.empresa,
      10: ticket.cubicacion,
      11: ticket.noEmpleado,
      12: ticket.idCamion,
      13: ticket.checkerName,
      14: ticket.checkerNo,
    };

    const dataQr = JSON.stringify(ticketCompacto);
    let compressedBase64 = "";

    try {
      const compressed = pako.deflate(dataQr, { level: 9 });
      const byteArrayAsNumberArray = Array.from(compressed);
      compressedBase64 = Buffer.from(byteArrayAsNumberArray).toString("base64");
    } catch (error) {
      console.error("Error al comprimir los datos para el QR:", error);
      throw new Error("La compresión de los datos del ticket falló.");
    }

    return compressedBase64;
  }

  public static decompressTicketData(
    compressedBase64: string
  ): VoucherCamion | null {
    try {
      const compressedBytes = Uint8Array.from(atob(compressedBase64), (c) =>
        c.charCodeAt(0)
      );
      const decompressed = pako.inflate(compressedBytes, { to: "string" });
      const originalData = JSON.parse(decompressed);
      const ticket: any = {};
      for (const key in originalData) {
        const numericKey = parseInt(key);
        const fieldName = this.fieldMap[numericKey];
        ticket[fieldName] = originalData[key];
      }

      if (ticket.idCamion) {
        const idParts = ticket.idCamion.split("-");
        if (idParts.length === 3 && idParts[0] === "TM") {
          ticket.frenteNombre = idParts[1];
          ticket.noEconomico = idParts[2];
        } else {
          throw new Error("Formato de ID del camión no es válido.");
        }
      }

      return ticket as VoucherCamion;
    } catch (error) {
      return null;
    }
  }
}

export default DataCompressor;
