import ExcelJS from "exceljs";
import prisma from "@/lib/db";
import blobClient from "@/lib/blobClient";
import { datasetConfigs } from "@/actions/voucherCamion/datasetConfig";
import { DatasetKey } from "@/types/types";

export default class DatabaseDownloader {
  private convertCamelCaseToSpaces(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .replace(/^./, (str) => str.toUpperCase());
  }

  private async extractFrenteName(fileName: string): Promise<string> {
    const underscoreIndex = fileName.indexOf("_");
    const dotIndex = fileName.indexOf(".");
    return fileName.substring(underscoreIndex + 1, dotIndex).replace(/\s+/g, "");
  }

  async fetchRecords(key: DatasetKey, frenteName: string): Promise<any[]> {
    const where = { frenteNombre: frenteName };

    switch (key) {
        case "gasolina":
        return prisma.gasolina.findMany({ where });
        case "acarreos":
        return prisma.acarreos.findMany({ where });
        case "concreto":
        return prisma.concreto.findMany({ where });
        case "asfalto":
        return prisma.asfalto.findMany({ where });
        case "vouchercamion": {
          const vouchers = await prisma.voucherCamion.findMany({ where });
          // Split voucherDatetime
          return vouchers.map(({ voucherDatetime, ...rest }) => ({
            ...rest,
            voucherDatetimeDate: voucherDatetime,
            voucherDatetimeTime: voucherDatetime,
          }));
        }
        default: {
        const _exhaustive: never = key;
        throw new Error(`Unsupported key: ${_exhaustive}`);
        }
    }
  }
  
  private processRecords(records: any[], key: DatasetKey): any[] {
    const cfg = datasetConfigs[key] ?? {};
    const headerMap = cfg.headerMap ?? {};
    const transforms = cfg.transforms ?? {};

    return records.map((record) => {
      const updatedRecord: any = {};

      for (const field of Object.keys(record)) {
        const baseKey = this.convertCamelCaseToSpaces(field);
        const mappedHeader = headerMap[baseKey] ?? baseKey;

        const rawValue = record[field];
        const transform = transforms[baseKey];

        const finalValue = transform ? transform(rawValue, record) : rawValue;

        updatedRecord[mappedHeader] = finalValue ?? "";
      }

      return updatedRecord;
    });
  }

  private async generateExcelSheet(processedRecords: any[], key: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheetName = key.charAt(0).toUpperCase() + key.slice(1);
    const worksheet = workbook.addWorksheet(sheetName);

    if (processedRecords.length > 0) {
      const headers = Object.keys(processedRecords[0]);

      worksheet.columns = headers.map((header, index) => ({
        header,
        key: header,
        width: index === 0 ? 36 : undefined,
      }));

      for (const record of processedRecords) {
        worksheet.addRow(record);
      }
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async deleteOldBlobIfExists(frenteName: string, key: DatasetKey): Promise<void> {
    const frente = await prisma.frente.findUnique({
      where: { nombre: frenteName },
      select: {
        excelUrlAcarreosBlob: true,
        excelUrlGasolinaBlob: true,
        excelUrlConcretoBlob: true,
        excelUrlAsfaltoBlob: true,
        excelUrlVoucherCamionBlob: true,
      },
    });

    const oldUrlMap: Record<DatasetKey, string | null | undefined> = {
      acarreos: frente?.excelUrlAcarreosBlob,
      gasolina: frente?.excelUrlGasolinaBlob,
      concreto: frente?.excelUrlConcretoBlob,
      asfalto: frente?.excelUrlAsfaltoBlob,
      vouchercamion: frente?.excelUrlVoucherCamionBlob,
    };

    const oldUrl = oldUrlMap[key];
    if (oldUrl) {
      try {
        await blobClient.deleteBlob(oldUrl);
        console.log(`Deleted old blob for ${frenteName}/${key}: ${oldUrl}`);
      } catch (error) {
        console.warn(`Failed to delete old blob (${oldUrl}):`, error);
      }
    }
  }

  private async uploadToBlob(path: string, buffer: Buffer): Promise<string> {
    const blobUrlResult = await blobClient.putBlob(path, buffer, { access: "public" });
    return blobUrlResult.url;
  }

  private async updateDatabase(
    cleanFrenteName: string,
    key: DatasetKey,
    blobUrl: string
  ): Promise<void> {
    const updateFieldMap: Record<DatasetKey, string> = {
      acarreos: "excelUrlAcarreosBlob",
      gasolina: "excelUrlGasolinaBlob",
      concreto: "excelUrlConcretoBlob",
      asfalto: "excelUrlAsfaltoBlob",
      vouchercamion: "excelUrlVoucherCamionBlob",
    };

    await prisma.frente.update({
      where: { nombre: cleanFrenteName },
      data: {
        [updateFieldMap[key]]: blobUrl,
      },
    });
  }

  public async downloadDatabase(
    outputExcel: string,
    key: DatasetKey,
    fileName: string
  ): Promise<void> {
    try {
      const cleanFrenteName = await this.extractFrenteName(fileName);

      const records = await this.fetchRecords(key, cleanFrenteName);
      const processedRecords = this.processRecords(records, key);

      const buffer = await this.generateExcelSheet(processedRecords, key);

      await this.deleteOldBlobIfExists(cleanFrenteName, key);
      const blobUrl = await this.uploadToBlob(`${outputExcel}${key}.xlsx`, buffer);

      await this.updateDatabase(cleanFrenteName, key, blobUrl);

      console.log("Excel file uploaded to Vercel Blob successfully.");
    } catch (error) {
      console.error("Error during database download and upload:", error);
      throw error;
    }
  }
}