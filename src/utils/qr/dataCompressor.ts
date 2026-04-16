import { VoucherCamion } from "@prisma/client";
import pako from "pako";
import { Buffer } from "buffer";

class DataCompressor {
  public static readonly DATA_CAMION_SUFFIX = "::SDNQR";

  private static fieldMap: { [key: number]: keyof VoucherCamion } = {
    1: "folio",
    2: "destino",
    3: "voucherTime",
    4: "origen",
    5: "material",
    6: "placas",
    7: "odometer",
    8: "operador",
    9: "turno",
    10: "localidad",
    11: "empresa",
    12: "cubicacion",
    13: "noEmpleado",
    14: "idCamion",
    15: "checkerName",
    16: "checkerNo",
  };

  private static fromBase64Url(b64url: string) {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    return b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
  }

  private static normalizeDigest(digest: string) {
    const s = (digest || "").trim();
    if (!s) return "";

    const isBase64Url =
      /^[A-Za-z0-9\-_]+$/.test(s) && !/[+/=]/.test(s) && /[-_]/.test(s);

    return isBase64Url ? this.fromBase64Url(s) : s;
  }

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
      1: ticket.folio,
      2: ticket.destino,
      3: new Date(ticket.voucherTime).getTime(),
      4: ticket.origen,
      5: ticket.material,
      6: ticket.placas,
      7: ticket.odometer,
      8: ticket.operador,
      9: ticket.turno,
      10: ticket.localidad,
      11: ticket.empresa,
      12: ticket.cubicacion,
      13: ticket.noEmpleado,
      14: ticket.idCamion,
      15: ticket.checkerName,
      16: ticket.checkerNo,
    };

    try {
      const dataQr = JSON.stringify(ticketCompacto);
      const compressed = pako.deflate(dataQr, { level: 9 });
      return Buffer.from(compressed).toString("base64");
    } catch (error) {
      console.error("Error al comprimir los datos para el QR:", error);
      throw new Error("La compresión de los datos del ticket falló.");
    }
  }

  public static decompressTicketData(digest: string): VoucherCamion | null {
    try {
      const normalized = this.normalizeDigest(digest);
      if (!normalized) return null;

      const compressedBytes = Buffer.from(normalized, 'base64');
      const decompressed = pako.inflate(compressedBytes, { to: 'string' });
      const originalData = JSON.parse(decompressed);

      const ticket: any = {};
      for (const key in originalData) {
        const numericKey = parseInt(key, 10);
        const fieldName = this.fieldMap[numericKey];
        if (fieldName) ticket[fieldName] = originalData[key];
      }

      if (ticket.voucherTime) {
        const asNumber = Number(ticket.voucherTime);
        ticket.voucherTime = !isNaN(asNumber)
          ? new Date(asNumber)
          : new Date(ticket.voucherTime);
      }

      if (ticket.idCamion) {
        const idParts = ticket.idCamion.split('-');
        if (idParts.length >= 3 && idParts[0] === 'SDN') {
          ticket.frenteNombre = idParts.slice(1, -1).join('-');
          ticket.noEconomico = idParts[idParts.length - 1];
        }
      }

      return ticket as VoucherCamion;
    } catch (error) {
      console.error('Error al descomprimir los datos del QR:', error);
      return null;
    }
  }
}

export default DataCompressor;

