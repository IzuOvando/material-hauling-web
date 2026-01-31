import { VoucherCamion } from "@prisma/client";
import pako from "pako";
import { Buffer } from "buffer";

class DataCompressor {
  public static readonly DATA_CAMION_SUFFIX = "::SDNQR";

  private static fieldMap: { [key: number]: keyof VoucherCamion } = {
    1: "uuid",
    2: "tiro",
    3: "voucherTime",
    4: "origen",
    5: "material",
    6: "placas",
    7: "odometer",
    8: "operador",
    9: "turno",
    10: "ejido",
    11: "empresa",
    12: "cubicacion",
    13: "noEmpleado",
    14: "idCamion",
    15: "checkerName",
    16: "checkerNo",
  };

  public static compressString(value: string): string {
    const compressed = pako.deflate(value, { level: 9 });
    return Buffer.from(compressed).toString("base64");
  }

  public static decompressString(base64: string): string {
    const bytes = Buffer.from(base64, "base64");
    return pako.inflate(bytes, { to: "string" });
  }

  public static compressTicketData(ticket: VoucherCamion): string {
    const ticketCompacto = {
      1: ticket.uuid,
      2: ticket.tiro,
      3: ticket.voucherTime,
      4: ticket.origen,
      5: ticket.material,
      6: ticket.placas,
      7: ticket.odometer,
      8: ticket.operador,
      9: ticket.turno,
      10: ticket.ejido,
      11: ticket.empresa,
      12: ticket.cubicacion,
      13: ticket.noEmpleado,
      14: ticket.idCamion,
      15: ticket.checkerName,
      16: ticket.checkerNo,
    };

    const dataQr = JSON.stringify(ticketCompacto);

    try {
      const compressed = pako.deflate(dataQr, { level: 9 });
      return Buffer.from(compressed).toString("base64");
    } catch (error) {
      console.error("Error al comprimir los datos para el QR:", error);
      throw new Error("La compresión de los datos del ticket falló.");
    }
  }

  public static decompressTicketData(compressedBase64: string): VoucherCamion | null {
    try {
      const compressedBytes = Buffer.from(compressedBase64, "base64");
      const decompressed = pako.inflate(compressedBytes, { to: "string" });

      const originalData = JSON.parse(decompressed);
      const ticket: any = {};

      for (const key in originalData) {
        const numericKey = parseInt(key, 10);
        const fieldName = this.fieldMap[numericKey];
        if (fieldName) ticket[fieldName] = originalData[key];
      }

      if (ticket.idCamion) {
        const idParts = ticket.idCamion.split("-");
        if (idParts.length === 3 && idParts[0] === "SDN") {
          ticket.frenteNombre = idParts[1];
          ticket.noEconomico = idParts[2];
        }
      }

      return ticket as VoucherCamion;
    } catch (error) {
      console.error("Error al descomprimir los datos del QR:", error);
      return null;
    }
  }
}

export default DataCompressor;

