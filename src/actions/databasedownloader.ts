import * as XLSX from "xlsx";
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
        const date = new Date(hour);
        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const suffix = hours >= 12 ? 'p.m.' : 'a.m.';

        hours = hours % 12;
        hours = hours ? hours : 12;

        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

        return `${hours}:${formattedMinutes} ${suffix}`;
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

    async fetchRecords(key: 'gasolina' | 'acarreos' | 'concreto' | 'vouchercamion', frenteName: string): Promise<any[]> {
        const modelMap = {
            gasolina: prisma.gasolina,
            acarreos: prisma.acarreos,
            concreto: prisma.concreto,
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

    private generateExcelSheet(processedRecords: any[], key: string): Buffer {
        const worksheet = XLSX.utils.json_to_sheet(processedRecords, {
            cellDates: false,
            cellStyles: false
        });

        worksheet['!cols'] = [{ wch: 36 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, key.charAt(0).toUpperCase() + key.slice(1));

        return XLSX.write(workbook, { type: 'buffer' });
    }

    private async uploadToBlob(path: string, buffer: Buffer): Promise<string> {
        const blobUrlResult = await blobClient.putBlob(path, buffer, { access: 'public' });
        return blobUrlResult.url;
    }

    private async updateDatabase(
        cleanFrenteName: string, 
        key: 'gasolina' | 'acarreos' | 'concreto' | 'vouchercamion', 
        blobUrl: string
    ): Promise<void> {
        const updateFieldMap = {
            acarreos: 'excelUrlAcarreosBlob',
            gasolina: 'excelUrlGasolinaBlob',
            concreto: 'excelUrlConcretoBlob',
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
        key: 'gasolina' | 'acarreos' | 'concreto' | 'vouchercamion', 
        fileName: string
    ): Promise<void> {
        try {
            const cleanFrenteName = await this.extractFrenteName(fileName);
            const records = await this.fetchRecords(key, cleanFrenteName);
            const processedRecords = this.processRecords(records);
            const buffer = this.generateExcelSheet(processedRecords, key);
            const blobUrl = await this.uploadToBlob(`${outputExcel}${key}.xlsx`, buffer);
            await this.updateDatabase(cleanFrenteName, key, blobUrl);
    
            console.log('Excel file uploaded to Vercel Blob successfully.');
        } catch (error) {
            console.error('Error during database download and upload:', error);
            throw error;
        }
    }
    
}
