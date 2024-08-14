import * as XLSX from "xlsx";
import * as path from "path";
import prisma from "@/lib/db";
import csvParser from "csv-parser";
import blobClient from "@/lib/blobClient";
import axios from 'axios';
import { Readable } from 'stream';
import { schemas, SchemaKeys } from "@/lib/schemas/headers";
import { CreateTicketDto, filteredDataConfig, isCreateAcarreosDto, isCreateGasolinaDto } from '@/lib/schemas/csv_schemas';
import CONFIG from "@/config";



class FileProcessor {

    private toCamelCase(str: string): string {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9\s]/gi, "")
            .split(" ")
            .map((word, index) => {
                if (index === 0) {
                    return word;
                } else {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }
            })
            .join("");
    }


    private formatDateGas(value: number | string): string {
        const spanishDatePattern = /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo), \d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}$/;
        const englishDatePattern = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\w+) (\d{1,2}), (\d{4})$/;
        const months: { [key: string]: string } = {
            January: 'enero', February: 'febrero', March: 'marzo', April: 'abril',
            May: 'mayo', June: 'junio', July: 'julio', August: 'agosto',
            September: 'septiembre', October: 'octubre', November: 'noviembre', December: 'diciembre'
        };
        const days: { [key: string]: string } = {
            Monday: 'lunes', Tuesday: 'martes', Wednesday: 'miércoles',
            Thursday: 'jueves', Friday: 'viernes', Saturday: 'sábado', Sunday: 'domingo'
        };

        if (typeof value === "string") {
            const cleanedValue = value.replace(/^"|"$/g, '');

            const match = englishDatePattern.exec(cleanedValue);
            if (match) {
                const [, engDay, engMonth, day, year] = match;
                return `${days[engDay as keyof typeof days]}, ${day} de ${months[engMonth as keyof typeof months]} de ${year}`;
            } else if (spanishDatePattern.test(cleanedValue)) {
                return cleanedValue;
            }
        }
        return String(value);
    }

    private formatDateAca(value: number | string): string {

        if (typeof value === "number") {
            const date = new Date(Date.UTC(0, 0, value - 1));
            const day = String(date.getUTCDate()).padStart(2, "0");
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const year = date.getUTCFullYear();
            return `${day}-${month}-${year}`;
        }

        if (typeof value === "string") {
            if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(value)) {
                const [month, day, year] = value.split("/");
                const fullYear = (parseInt(year) < 50 ? "20" : "19") + year.padStart(2, "0");
                return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
            }

            if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                const [day, month, year] = value.split("/");
                return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
            }

            if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                const [day, month, year] = value.split("-");
                return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
            }
        }

        return String(value);
    }

    private isDateColumn(value: string): boolean {

        const normalizedValue = value.trim().replace(/^"|"$/g, '').replace(/\s*,\s*/g, ',').replace(/\s{2,}/g, ' ');
        const englishDatePattern = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},\d{4}$/

        return (
            /^\d{2}\/\d{2}\/\d{4}$/.test(normalizedValue) ||
            /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(normalizedValue) ||
            /^\d{2}-\d{2}-\d{4}$/.test(normalizedValue) ||
            englishDatePattern.test(normalizedValue)
        );
    }

    public async streamToBuffer(stream: Readable): Promise<Buffer> {
        const chunks: Buffer[] = [];

        return new Promise<Buffer>((resolve, reject) => {
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });
    }

    public async excelToCSV(
        buffer: Buffer,
        outputFolder: string,
        validHeaders: Set<string>,
        key: string
    ): Promise<string[]> {
        const csvFilePaths: string[] = [];

        const isValidHeaderRow = (headers: string[], validHeaders: Set<string>) => {
            const normalize = (header: string) => header.replace(/\s+/g, '').toLowerCase();

            const cleanedHeaders = new Set(headers.map(normalize).filter(header => header.length > 0));
            const normalizedValidHeaders = new Set(Array.from(validHeaders).map(normalize));

            for (const header of cleanedHeaders) {
                if (!normalizedValidHeaders.has(header)) {
                    return false;
                }
            }
            return true;
        };

        const validateCellType = (value: string, expectedType: string): boolean => {
            switch (expectedType) {
                case 'date':
                    return !isNaN(Date.parse(value));
                case 'number':
                    return !isNaN(Number(value));
                case 'string':
                    return typeof value === 'string';
                default:
                    return true;
            }
        };

        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            const promises = workbook.SheetNames.map(async (sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet["!ref"]) {
                    console.error(`Sheet ${sheetName} is empty or malformed.`);
                    return;
                }

                const range = XLSX.utils.decode_range(worksheet["!ref"]);
                let csvOutput = "";
                let dateColumns = new Set<number>();
                let headerChecked = false;

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    let row: string[] = [];
                    let empty = true;

                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = { c: C, r: R };
                        const cellRef = XLSX.utils.encode_cell(cellAddress);
                        const cell = worksheet[cellRef];
                        let cellValue = cell ? cell.w || cell.v : "";
                        if (typeof cellValue === 'string') {
                            cellValue = cellValue.replace(/"/g, '""');
                            if (cellValue.includes(',') || cellValue.includes('"')) {
                                cellValue = `"${cellValue}"`;
                            }
                        }
                        row.push(cellValue);

                        if (this.isDateColumn(cellValue)) {
                            dateColumns.add(C);
                        }

                        if (cellValue.trim() !== '') empty = false;
                    }

                    if (empty) {
                        continue;
                    }

                    if (!headerChecked) {
                        if (!isValidHeaderRow(row, validHeaders)) {
                            continue;
                        }
                        row = row.map((header) => {
                            const camelCaseHeader = this.toCamelCase(header.toString());
                            return camelCaseHeader;
                        });
                        csvOutput += row.join(",") + "\n";
                        headerChecked = true;
                        continue;
                    }

                    row = row.map((cellValue, index) => {
                        if (dateColumns.has(index) && cellValue) {
                            if (key === "gasolina") {
                                cellValue = this.formatDateGas(cellValue.toString());
                            } else {
                                cellValue = this.formatDateAca(cellValue.toString());
                            }
                            cellValue = cellValue.replace(/"/g, '""');
                            return `"${cellValue}"`;
                        }

                        if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('"'))) {
                            cellValue = cellValue.replace(/"/g, '""');
                            return `"${cellValue}"`;
                        }
                        const expectedType = 'string';
                        if (!validateCellType(cellValue, expectedType)) {
                            console.error(`Invalid cell type for value: ${cellValue}`);
                            return '';
                        }
                        return (cellValue);
                    });
                    csvOutput += row.join(",") + "\n";
                }

                const fileNameWithoutExtension = path.basename(buffer.toString(), path.extname(buffer.toString()));
                const match = fileNameWithoutExtension.match(/_(.*)/);
                const extractedPart = match ? match[1] : '';
                const outputFilePath = path.join(
                    outputFolder,
                    `${extractedPart}_${sheetName.replace(/[\s\/]+/g, "_")}.csv`
                );

                if (!csvOutput || csvOutput.trim() === '') {
                    throw new Error(`El archivo CSV para ${sheetName} está vacío.`);
                }

                const blob = await blobClient.putBlob(outputFilePath, Buffer.from(csvOutput), { access: 'public' });
                const blobUrl = blob.url;
                csvFilePaths.push(blobUrl);
            });

            await Promise.all(promises);

            return csvFilePaths;

        } catch (error) {
            console.error("Error al procesar el archivo Excel:", error);
            throw error;
        }
    }

    public cleanQuotes = (str: string): string => {
        if (typeof str !== 'string') {
            return '';
        }
        return str.replace(/""/g, '"').replace(/^"|"$/g, '');
    };


    private getFilteredData(key: string, data: any, fileName: string): CreateTicketDto {
        const config = filteredDataConfig[key];
        if (!config) {
            throw new Error(`Unsupported key: ${key}`);
        }
        return config(data, fileName, this.cleanQuotes);
    }


    private async processBatch(records: CreateTicketDto[], cleanFrenteName: string, key: string) {

        try {
            if (key === 'acarreos') {
                const acarreosData = records.filter(isCreateAcarreosDto).map(record => {
                    const acarreoEntry: {
                        uuid?: string;
                        frenteNombre: string;
                        folio: number;
                        empresa: string;
                        material: string;
                        cubicacion: number;
                        fecha: Date;
                        placas: string;
                        idCamion: string;
                        operador: string;
                        proyecto: string;
                        noEmpleado: string;
                        checador: string;
                        hora: Date;
                        banco: string;
                    } = {
                        frenteNombre: record.frenteNombre,
                        folio: record.folio,
                        empresa: record.empresa,
                        material: record.material,
                        cubicacion: record.cubicacion,
                        fecha: record.fecha,
                        placas: record.placas,
                        idCamion: record.idCamion,
                        operador: record.operador,
                        proyecto: record.proyecto,
                        noEmpleado: record.noEmpleado,
                        checador: record.checador,
                        hora: record.hora,
                        banco: record.banco,
                    };
                    if (record.uuid) {
                        acarreoEntry.uuid = record.uuid;
                    }

                    return acarreoEntry;
                });

                await prisma.acarreos.createMany({
                    data: acarreosData,
                });

                const acarreoUuids = await prisma.acarreos.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                    select: {
                        uuid: true,
                    },
                });

                await this.updateFrenteInBatches(cleanFrenteName, acarreoUuids, 'ticketsAcarreos');
            } else if (key === 'gasolina') {
                const gasolinaData = records.filter(isCreateGasolinaDto).map(record => {
                    const gasolinaEntry: {
                        uuid?: string;
                        frenteNombre: string;
                        folio: number;
                        saldoCompra: number;
                        formatoPago: string;
                        litros: number;
                        fecha: Date;
                        placas: string;
                        autorizacion: string;
                        total: number;
                        hora: Date;
                        bomba: number;
                        precioUnitario: number;
                    } = {
                        frenteNombre: record.frenteNombre,
                        folio: record.folio,
                        saldoCompra: record.saldoCompra,
                        formatoPago: record.formatoPago,
                        litros: record.litros,
                        fecha: record.fecha,
                        placas: record.placas,
                        autorizacion: record.autorizacion,
                        total: record.total,
                        hora: record.hora,
                        bomba: record.bomba,
                        precioUnitario: record.precioUnitario,
                    };

                    if (record.uuid && record.uuid.trim() !== '') {
                        gasolinaEntry.uuid = record.uuid;
                    }

                    return gasolinaEntry;
                });

                await prisma.gasolina.createMany({
                    data: gasolinaData,
                });

                const gasolinaUuids = await prisma.gasolina.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                    select: {
                        uuid: true,
                    },
                });

                await this.updateFrenteInBatches(cleanFrenteName, gasolinaUuids, 'ticketsGasolina');
            }
        } catch (error) {
            console.error("Error during batch processing:", error);
            throw error;
        }
    }

    private async updateFrenteInBatches(frenteNombre: string, uuids: { uuid: string }[], relationField: string) {
        const batchSize = CONFIG.BATCHES_RECORDS;
        const updatePromises = [];

        for (let i = 0; i < uuids.length; i += batchSize) {
            const batch = uuids.slice(i, i + batchSize);
            updatePromises.push(
                prisma.frente.update({
                    where: { nombre: frenteNombre },
                    data: {
                        [relationField]: {
                            connect: batch,
                        },
                    },
                })
            );

            if (updatePromises.length >= 5) {
                await Promise.all(updatePromises);
                updatePromises.length = 0;
            }
        }

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }
    }

    public async csvToSQLite(csvFile: string, fileName: string, key: string) {
        const batchSize = CONFIG.BATCHES_CSV_LINES;

        const underscoreIndex = fileName.indexOf('_');
        const dotIndex = fileName.indexOf('.');
        const cleanFrenteName = fileName.substring(underscoreIndex + 1, dotIndex);

        if (!cleanFrenteName) {
            console.error(`No se pudo extraer un nombre válido del archivo: ${fileName}`);
            return;
        }

        try {
            if (key === 'gasolina') {
                await prisma.gasolina.deleteMany({
                    where: { frenteNombre: cleanFrenteName },
                });
            } else if (key === 'acarreos') {
                await prisma.acarreos.deleteMany({
                    where: { frenteNombre: cleanFrenteName },
                });
            } else {
                throw new Error(`Unsupported key: ${key}`);
            }

            const frente = await prisma.frente.findUnique({
                where: { nombre: cleanFrenteName }
            });

            if (!frente) {
                console.error(`No se encontró el frente con el nombre: ${cleanFrenteName}`);
                return;
            }


            const response = await axios.get(csvFile, { responseType: 'stream' });
            const csvStream = response.data.pipe(csvParser());

            await new Promise<void>((resolve, reject) => {
                const records: CreateTicketDto[] = [];
                let activeBatches = 0;

                csvStream
                    .on('data', async (data: any) => {
                        csvStream.pause();
                        try {
                            const filteredData: CreateTicketDto = this.getFilteredData(key, data, fileName);
                            records.push(filteredData);

                            if (records.length >= batchSize) {
                                activeBatches++;
                                try {
                                    await this.processBatch(records, cleanFrenteName, key);
                                    records.length = 0;
                                } catch (error) {
                                    if (error instanceof Error) {
                                        csvStream.destroy(error);
                                    } else {
                                        csvStream.destroy(new Error(`Non-error thrown: ${error}`));
                                    }
                                    reject(error);
                                    return;
                                }
                                activeBatches--;
                            }

                            csvStream.resume();
                        } catch (error) {
                            console.error("Error processing data:", error);
                            if (error instanceof Error) {
                                csvStream.destroy(error);
                            } else {
                                csvStream.destroy(new Error(`Non-error thrown: ${error}`));
                            }
                            reject(error);
                        }
                    })
                    .on('error', (error: Error) => {
                        console.error(`Error processing CSV file: ${error}`);
                        reject(error);
                    })
                    .on('end', async () => {
                        if (records.length > 0) {
                            activeBatches++;
                            try {
                                await this.processBatch(records, cleanFrenteName, key);
                            } catch (error) {
                                reject(error);
                                return;
                            }
                            activeBatches--;
                        }
                        const checkCompletion = setInterval(() => {
                            if (activeBatches === 0) {
                                clearInterval(checkCompletion);
                                resolve();
                            }
                        }, 100);
                    });
            });

        } catch (error) {
            console.error("Error durante la inserción en la base de datos:", error);
            throw error;
        }
    }

    public isValidKey(key: string): key is SchemaKeys {
        return ['gasolina', 'acarreos'].includes(key);
    }

    public async streamToNodeReadable(stream: ReadableStream<Uint8Array>): Promise<Readable> {
        const reader = stream.getReader();
        const nodeStream = new Readable({
            read() {
                reader.read().then(({ value, done }) => {
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(value);
                    }
                }).catch(err => this.emit('error', err));
            }
        });
        return nodeStream;
    }

    public async processFiles(fileName: string, area: string, excelBlobUrl: string) {
        const key = area.toLowerCase();
        if (!this.isValidKey(key)) {
            console.error(`Invalid area type: ${key}`);
            throw new Error(`Invalid area type: ${key}`);
        }
        const validHeaders = schemas[key];
        const desiredPart = fileName.split('_')[1].split('.')[0];
        const outputExcelFolder = `db_output/excel/${desiredPart}`;
        const outputCSVFolder = `db_output/csv/${desiredPart}`;

        try {

            const response = await fetch(excelBlobUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch the blob from URL: ${excelBlobUrl}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const csvFilePaths = await this.excelToCSV(buffer, outputCSVFolder, validHeaders, key);

            await this.processCSVFiles(csvFilePaths, fileName, key);

            await this.downloadDatabase(outputExcelFolder, key, fileName)

            fetch(`${CONFIG.BASE_URL}/api/files/delete-blobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blobUrls: [excelBlobUrl, ...csvFilePaths] }),
            }).catch(error => console.error('Error al llamar al endpoint de eliminación de blobs:', error));

        } catch (error) {
            console.error("Error during file processing:", error);
            throw error;
        }
    }

    private async processCSVFiles(csvFilePaths: string[], fileName: string, key: string) {
        for (const csvFilePath of csvFilePaths) {
            await this.csvToSQLite(csvFilePath, fileName, key);
        }
    }

    private convertCamelCaseToSpaces(key: string): string {
        return key.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
            .replace(/^./, str => str.toUpperCase());
    }


    private async downloadDatabase(outputExcel: string, key: string, fileName: string): Promise<void> {

        try {
            const underscoreIndex = fileName.indexOf('_');
            const dotIndex = fileName.indexOf('.');
            const cleanFrenteName = fileName.substring(underscoreIndex + 1, dotIndex).replace(/\s+/g, '');

            let records: any[] = [];
            if (key === 'gasolina') {
                records = await prisma.gasolina.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                });
            } else if (key === 'acarreos') {
                records = await prisma.acarreos.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                });
            } else {
                throw new Error(`Unsupported key: ${key}`);
            }

            const processedRecords = records.map(record => {
                const updatedRecord: any = {};
                Object.keys(record).forEach(data => {
                    const newKey = this.convertCamelCaseToSpaces(data);
                    let value = record[data];

                    if (newKey.toLowerCase().includes('uuid')) {
                        value = value.toString();
                    }

                    updatedRecord[newKey] = value;
                });
                return updatedRecord;
            });

            const worksheet = XLSX.utils.json_to_sheet(processedRecords, {
                cellDates: false,
                cellStyles: false
            });

            worksheet['!cols'] = [{ wch: 36 }];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, key.charAt(0).toUpperCase() + key.slice(1));

            const filename = `${key}.xlsx`;

            const buffer = XLSX.write(workbook, { type: 'buffer' });


            const blobUrlResult = await blobClient.putBlob(`${outputExcel}${filename}`, buffer, { access: 'public' });

            const blobUrl = blobUrlResult.url;

            console.log('Excel file uploaded to Vercel Blob successfully.');

            const updateField = key === 'acarreos' ? 'excelUrlAcarreosBlob' : 'excelUrlGasolinaBlob';

            await prisma.frente.update({
                where: {
                    nombre: cleanFrenteName
                },
                data: {
                    [updateField]: blobUrl
                }
            });


        } catch (error) {
            console.error('Error during database download and upload:', error);
            throw error;
        }
    }

}

export default FileProcessor;