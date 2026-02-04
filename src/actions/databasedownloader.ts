import ExcelJS from "exceljs";
import prisma from "@/lib/db";
import blobClient from "@/lib/blobClient";
import { DateTime } from "luxon";

export default class DatabaseDownloader { 

    private convertCamelCaseToSpaces(key: string): string {
        return key.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
            .replace(/^./, str => str.toUpperCase());
    }

    private formatHour(hour: string): string {
        let dt = DateTime.fromISO(hour, { zone: 'utc' });

        if (!dt.isValid) {
            const jsDate = new Date(hour);
    
            if (isNaN(jsDate.getTime())) {
                throw new Error(`Invalid DateTime for 'voucher time': Unable to parse "${hour}"`);
            }
    
            dt = DateTime.fromJSDate(jsDate, { zone: 'utc' });
        }
    
        if (!dt.isValid) {
            throw new Error(`Invalid DateTime for 'voucher time': ${dt.invalidExplanation}`);
        }

        dt = dt.setZone('America/Mexico_City');
        const hours = dt.hour % 12 || 12;
        const minutes = dt.minute < 10 ? `0${dt.minute}` : dt.minute;
        const suffix = dt.hour >= 12 ? 'p.m.' : 'a.m.';
    
        return `${hours}:${minutes} ${suffix}`;
    }

    private formatDateToDDMMYYYY(date: Date): string {
        return DateTime.fromJSDate(date, { zone: 'utc' })
            .setZone('America/Mexico_City')
            .toFormat('dd/MM/yyyy');
    }

    private async extractFrenteName(fileName: string): Promise<string> {
        const underscoreIndex = fileName.indexOf('_');
        const dotIndex = fileName.indexOf('.');
        return fileName.substring(underscoreIndex + 1, dotIndex).replace(/\s+/g, '');
    }

    async fetchRecords(key: 'gasolina' | 'acarreos' | 'concreto' | 'vouchercamion' | 'asfalto', frenteName: string): Promise<any[]> {
        const modelMap = {
            gasolina: prisma.gasolina,
            acarreos: prisma.acarreos,
            concreto: prisma.concreto,
            asfalto: prisma.asfalto,
            vouchercamion: prisma.voucherCamion,
        };
    
        if (key === 'gasolina') {
            return modelMap.gasolina.findMany({
                where: {
                    frenteNombre: frenteName,
                },
            });
        } else if (key === 'acarreos') {
            return modelMap.acarreos.findMany({
                where: {
                    frenteNombre: frenteName,
                },
            });
        } else if (key === 'concreto') {
            return modelMap.concreto.findMany({
                where: {
                    frenteNombre: frenteName,
                },
            });
        } else if (key === 'asfalto') {
            return modelMap.asfalto.findMany({
                where: {
                    frenteNombre: frenteName,
                },
            });
        } else if (key === 'vouchercamion') {
            return modelMap.vouchercamion.findMany({
                where: {
                    frenteNombre: frenteName,
                },
            });
        }
    
        throw new Error(`Unsupported key: ${key}`);
    }

    private processVoucherValue(newKey: string, value: string): string {
        if (!value) return value;

        const key = newKey.toLowerCase();

        try {
            if (key === 'voucher time') {
                let dt = DateTime.fromISO(value, { zone: 'utc' });
                if (!dt.isValid) {
                    const jsDate = new Date(value);
                    if (isNaN(jsDate.getTime())) {
                        throw new Error(`Invalid DateTime for 'voucher time': Unable to parse "${value}"`);
                    }
                    dt = DateTime.fromJSDate(jsDate, { zone: 'utc' });
                }

                if (!dt.isValid) {
                    throw new Error(`Invalid DateTime for 'voucher time': ${dt.invalidExplanation}`);
                }

                const formattedTime = dt.setZone('America/Mexico_City').toFormat('hh:mm a');
                return formattedTime;
            }

            if (key === 'voucher date') {
                let dt = DateTime.fromISO(value, { zone: 'utc' });
                if (!dt.isValid) {
                    const jsDate = new Date(value);
                    if (isNaN(jsDate.getTime())) {
                        throw new Error(`Invalid DateTime for 'voucher date': Unable to parse "${value}"`);
                    }
                    dt = DateTime.fromJSDate(jsDate, { zone: 'utc' });
                }

                if (!dt.isValid) {
                    throw new Error(`Invalid DateTime for 'voucher date': ${dt.invalidExplanation}`);
                }

                const formattedDate = dt.setZone('America/Mexico_City').toFormat('yyyy-MM-dd');
                return formattedDate;
            }

            return value;
        } catch (error) {
            throw error;
        }
    }


    private processRecords(records: any[]): any[] {
        return records.map(record => {
            const updatedRecord: any = {};
            Object.keys(record).forEach(data => {
                const newKey = this.convertCamelCaseToSpaces(data);
                let value = record[data];

                if (newKey.toLowerCase().includes('hora') && value) {
                    value = this.formatHour(value);
                }

                if (newKey.toLowerCase().includes('uuid')) {
                    value = value.toString();
                }

                if (['fecha', 'created at'].includes(newKey.toLowerCase()) && value) {
                    value = this.formatDateToDDMMYYYY(value);
                }

                if (['voucher time', 'voucher date'].includes(newKey.toLowerCase()) && value) {
                    value = this.processVoucherValue(newKey, value);
                }

                updatedRecord[newKey] = value;
            });
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

    private async uploadToBlob(path: string, buffer: Buffer): Promise<string> {
        const blobUrlResult = await blobClient.putBlob(path, buffer, { access: 'public' });
        return blobUrlResult.url;
    }

    private async updateDatabase(
        cleanFrenteName: string, 
        key: 'gasolina' | 'acarreos' | 'concreto' | 'vouchercamion' | 'asfalto', 
        blobUrl: string
    ): Promise<void> {
        const updateFieldMap = {
            acarreos: 'excelUrlAcarreosBlob',
            gasolina: 'excelUrlGasolinaBlob',
            concreto: 'excelUrlConcretoBlob',
            asfalto: 'excelUrlAsfaltoBlob',
            vouchercamion: 'excelUrlVoucherCamionBlob'
        };
    
        if (key === 'gasolina') {
            await prisma.frente.update({
                where: {
                    nombre: cleanFrenteName,
                },
                data: {
                    [updateFieldMap.gasolina]: blobUrl,
                },
            });
        } else if (key === 'acarreos') {
            await prisma.frente.update({
                where: {
                    nombre: cleanFrenteName,
                },
                data: {
                    [updateFieldMap.acarreos]: blobUrl,
                },
            });
        } else if (key === 'concreto') {
            await prisma.frente.update({
                where: {
                    nombre: cleanFrenteName,
                },
                data: {
                    [updateFieldMap.concreto]: blobUrl,
                },
            });
        } else if (key === 'asfalto') {
            await prisma.frente.update({
                where: {
                    nombre: cleanFrenteName,
                },
                data: {
                    [updateFieldMap.asfalto]: blobUrl,
                },
            });
        } else if (key === 'vouchercamion') {
            await prisma.frente.update({
                where: {
                    nombre: cleanFrenteName,
                },
                data: {
                    [updateFieldMap.vouchercamion]: blobUrl,
                },
            });
        } else {
            throw new Error(`Unsupported key: ${key}`);
        }
    }
    

    public async downloadDatabase(
        outputExcel: string, 
        key: 'gasolina' | 'acarreos' | 'concreto' | 'vouchercamion' | 'asfalto', 
        fileName: string
    ): Promise<void> {
        try {
            const cleanFrenteName = await this.extractFrenteName(fileName);
            const records = await this.fetchRecords(key, cleanFrenteName);
            const processedRecords = this.processRecords(records);
            const buffer = await this.generateExcelSheet(processedRecords, key);
            const blobUrl = await this.uploadToBlob(`${outputExcel}${key}.xlsx`, buffer);
            await this.updateDatabase(cleanFrenteName, key, blobUrl);
    
            console.log('Excel file uploaded to Vercel Blob successfully.');
        } catch (error) {
            console.error('Error during database download and upload:', error);
            throw error;
        }
    }
    
}
