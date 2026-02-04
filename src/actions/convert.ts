import ExcelJS, { Buffer as BufferExcelJs} from "exceljs"
import * as path from "path";
import prisma from "@/lib/db";
import csvParser from "csv-parser";
import blobClient from "@/lib/blobClient";
import axios from 'axios';
import { Readable } from 'stream';
import { schemas, SchemaKeys } from "@/lib/schemas/headers";
import { CreateTicketDto, filteredDataConfig, isCreateAcarreosDto, isCreateGasolinaDto, isCreateConcretoDto, isCreateAsfaltoDto } from '@/lib/schemas/csv_schemas';
import CONFIG from "@/config";
import DatabaseDownloader from "./databasedownloader";
import { validateUrlOrThrow } from "@/utils/urlValidator";



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

    private getCellStringValue(cell: ExcelJS.Cell): string {
        const value = cell.value;
        if (value === null || value === undefined) return "";
        if (value instanceof Date) {
            const d = value;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }
        if (typeof value === 'object' && 'richText' in value) {
            return (value as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join('');
        }
        if (typeof value === 'object' && 'text' in value) {
            return (value as ExcelJS.CellHyperlinkValue).text;
        }
        if (typeof value === 'object' && 'result' in value) {
            const result = (value as ExcelJS.CellFormulaValue).result;
            if (result === null || result === undefined) return "";
            return String(result);
        }
        return String(value);
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
        buffer: BufferExcelJs,
        outputFolder: string,
        validHeaders: Set<string>,
        key: string
    ): Promise<string[]> {
        const csvFilePaths: string[] = [];

        const isValidHeaderRow = (headers: string[], validHeaders: Set<string>) => {
            const normalize = (header: string) => header.replace(/\s+/g, '').toLowerCase();

            const cleanedHeaders = new Set(headers.map(normalize).filter(header => header.length > 0));
            const normalizedValidHeaders = new Set(Array.from(validHeaders).map(normalize));

            for (const validHeader of normalizedValidHeaders) {
                if (!cleanedHeaders.has(validHeader)) {
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
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const promises = workbook.worksheets.map(async (worksheet) => {
                const sheetName = worksheet.name;
                if (worksheet.rowCount === 0) {
                    console.error(`Sheet ${sheetName} is empty or malformed.`);
                    return;
                }

                const colCount = worksheet.columnCount;
                let csvOutput = "";
                let dateColumns = new Set<number>();
                let headerChecked = false;
                let shouldStop = false;

                for (let R = 1; R <= worksheet.rowCount; ++R) {
                    if (shouldStop) break;

                    let row: string[] = [];
                    let empty = true;
                    let emptyConsecutiveCount = 0;

                    for (let C = 1; C <= colCount; ++C) {
                        const cell = worksheet.getRow(R).getCell(C);
                        let cellValue = this.getCellStringValue(cell);
                        if (!cellValue || cellValue.trim() === '') {
                            emptyConsecutiveCount++;
                        } else {
                            emptyConsecutiveCount = 0;
                        }

                        if (emptyConsecutiveCount >= 3) {
                            console.warn(`Skipping the rest of the row due to 3 consecutive empty cells at row ${R}, column ${C}`);
                            if (empty) {
                                shouldStop = true;
                            }
                            break;
                        }

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
                            throw new Error("El encabezado del CSV no es válido.");
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
                        if (dateColumns.has(index + 1) && cellValue) {
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

                const uuids = acarreosData
                .map(record => record.uuid)
                .filter((uuid): uuid is string => uuid !== undefined);
            
                const existingRecords = await prisma.acarreos.findMany({
                    where: { uuid: { in: uuids } },
                    select: { uuid: true },
                });

                const existingUUIDSet = new Set(existingRecords.map(record => record.uuid));

                const recordsToUpdate = acarreosData.filter(
                    record => record.uuid && existingUUIDSet.has(record.uuid)
                );

                const recordsToCreate = acarreosData.filter(
                    record => !record.uuid || !existingUUIDSet.has(record.uuid)
                );
            
                await Promise.all(
                    recordsToUpdate.map(record =>
                        prisma.acarreos.update({
                            where: { uuid: record.uuid },
                            data: record,
                        })
                    )
                );
            
                if (recordsToCreate.length > 0) {
                    await prisma.acarreos.createMany({
                        data: recordsToCreate,
                        skipDuplicates: true,
                    });
                }

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
                        folio: string;
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

                const uuids = gasolinaData
                .map(record => record.uuid)
                .filter((uuid): uuid is string => uuid !== undefined);
            
                const existingRecords = await prisma.gasolina.findMany({
                    where: { uuid: { in: uuids } },
                    select: { uuid: true },
                });

                const existingUUIDSet = new Set(existingRecords.map(record => record.uuid));

                const recordsToUpdate = gasolinaData.filter(
                    record => record.uuid && existingUUIDSet.has(record.uuid)
                );

                const recordsToCreate = gasolinaData.filter(
                    record => !record.uuid || !existingUUIDSet.has(record.uuid)
                );
            
                await Promise.all(
                    recordsToUpdate.map(record =>
                        prisma.gasolina.update({
                            where: { uuid: record.uuid },
                            data: record,
                        })
                    )
                );
            
                if (recordsToCreate.length > 0) {
                    await prisma.gasolina.createMany({
                        data: recordsToCreate,
                        skipDuplicates: true,
                    });
                }

                const gasolinaUuids = await prisma.gasolina.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                    select: {
                        uuid: true,
                    },
                });

                await this.updateFrenteInBatches(cleanFrenteName, gasolinaUuids, 'ticketsGasolina');
            } else if (key === 'concreto') {
                const concretoData = records.filter(isCreateConcretoDto).map(record => {
                    const concretoEntry: {
                        uuid?: string;
                        frenteNombre: string;
                        cubicacion: number;
                        cliente: string;
                        empresa: string;
                        fecha: Date;
                        planta: string;
                        operador: string;
                        fc: string;
                        uso: string;
                        destino: string;
                        rev: number;
                        tempConcreto: number;
                        tempAmbiente: number;
                        noEconomico: string;
                        marca: string;
                        elemento: string;
                        horaSalida: Date;
                        placas: string;
                    } = {
                        frenteNombre: record.frenteNombre,
                        cubicacion: record.cubicacion,
                        cliente: record.cliente,
                        empresa: record.empresa,
                        fecha: record.fecha,
                        planta: record.planta,
                        operador: record.operador,
                        fc: record.fc,
                        uso: record.uso,
                        destino: record.destino,
                        rev: record.rev,
                        tempConcreto: record.tempConcreto,
                        tempAmbiente: record.tempAmbiente,
                        noEconomico: record.noEconomico,
                        marca: record.marca,
                        elemento: record.elemento,
                        horaSalida: record.horaSalida,
                        placas: record.placas
                    };

                    if (record.uuid && record.uuid.trim() !== '') {
                        concretoEntry.uuid = record.uuid;
                    }

                    return concretoEntry;
                });

                const uuids = concretoData
                .map(record => record.uuid)
                .filter((uuid): uuid is string => uuid !== undefined);
            
                const existingRecords = await prisma.concreto.findMany({
                    where: { uuid: { in: uuids } },
                    select: { uuid: true },
                });

                const existingUUIDSet = new Set(existingRecords.map(record => record.uuid));

                const recordsToUpdate = concretoData.filter(
                    record => record.uuid && existingUUIDSet.has(record.uuid)
                );

                const recordsToCreate = concretoData.filter(
                    record => !record.uuid || !existingUUIDSet.has(record.uuid)
                );
            
                await Promise.all(
                    recordsToUpdate.map(record =>
                        prisma.concreto.update({
                            where: { uuid: record.uuid },
                            data: record,
                        })
                    )
                );
            
                if (recordsToCreate.length > 0) {
                    await prisma.concreto.createMany({
                        data: recordsToCreate,
                        skipDuplicates: true,
                    });
                }

                const concretoUuids = await prisma.concreto.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                    select: {
                        uuid: true,
                    },
                });

                await this.updateFrenteInBatches(cleanFrenteName, concretoUuids, 'ticketsConcreto');
            } else if (key === 'asfalto') {
                const asfaltoData = records.filter(isCreateAsfaltoDto).map(record => {
                    const asfaltoEntry: {
                        uuid?: string;
                        frenteNombre: string;
                        cubicacion: number;
                        material: string;
                        empresa: string;
                        fecha: Date;
                        planta: string;
                        operador: string;
                        destino: string;
                        tempAsfalto: number;
                        noEconomico: string;
                        marca: string;
                        horaSalida: Date;
                        placas: string;
                    } = {
                        frenteNombre: record.frenteNombre,
                        cubicacion: record.cubicacion,
                        material: record.material,
                        empresa: record.empresa,
                        fecha: record.fecha,
                        planta: record.planta,
                        operador: record.operador,
                        destino: record.destino,
                        tempAsfalto: record.tempAsfalto,
                        noEconomico: record.noEconomico,
                        marca: record.marca,
                        horaSalida: record.horaSalida,
                        placas: record.placas
                    };

                    if (record.uuid && record.uuid.trim() !== '') {
                        asfaltoEntry.uuid = record.uuid;
                    }

                    return asfaltoEntry;
                });

                const uuids = asfaltoData
                .map(record => record.uuid)
                .filter((uuid): uuid is string => uuid !== undefined);
            
                const existingRecords = await prisma.asfalto.findMany({
                    where: { uuid: { in: uuids } },
                    select: { uuid: true },
                });

                const existingUUIDSet = new Set(existingRecords.map(record => record.uuid));

                const recordsToUpdate = asfaltoData.filter(
                    record => record.uuid && existingUUIDSet.has(record.uuid)
                );

                const recordsToCreate = asfaltoData.filter(
                    record => !record.uuid || !existingUUIDSet.has(record.uuid)
                );
            
                await Promise.all(
                    recordsToUpdate.map(record =>
                        prisma.asfalto.update({
                            where: { uuid: record.uuid },
                            data: record,
                        })
                    )
                );
            
                if (recordsToCreate.length > 0) {
                    await prisma.asfalto.createMany({
                        data: recordsToCreate,
                        skipDuplicates: true,
                    });
                }

                const asfaltoUuids = await prisma.asfalto.findMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                    select: {
                        uuid: true,
                    },
                });

                await this.updateFrenteInBatches(cleanFrenteName, asfaltoUuids, 'ticketsAsfalto');
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

        try {
            if (!cleanFrenteName || !key) {
                throw new Error('Missing required parameters: cleanFrenteName or key');
            }

            if (key === 'gasolina') {
                await prisma.gasolina.deleteMany({
                    where: { frenteNombre: cleanFrenteName },
                });
                console.log(`Deleted old gasolina records with frenteNombre: ${cleanFrenteName}`);
            } else if (key === 'acarreos') {
                await prisma.acarreos.deleteMany({
                    where: { frenteNombre: cleanFrenteName },
                });
                console.log(`Deleted old acarreos records with frenteNombre: ${cleanFrenteName}`);
            } else if (key === 'concreto') {
                await prisma.concreto.deleteMany({
                    where: { frenteNombre: cleanFrenteName },
                });
                console.log(`Deleted old concreto records with frenteNombre: ${cleanFrenteName}`);
            } else if (key === 'asfalto') {
                await prisma.asfalto.deleteMany({
                    where: { frenteNombre: cleanFrenteName },
                });
                console.log(`Deleted old asfalto records with frenteNombre: ${cleanFrenteName}`);
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
        return ['gasolina', 'acarreos', 'concreto', 'asfalto'].includes(key);
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

        // Validate URL to prevent SSRF attacks (defense in depth)
        validateUrlOrThrow(excelBlobUrl, "excelBlobUrl");

        const downloader = new DatabaseDownloader();
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

            const csvFilePaths = await this.excelToCSV(buffer as unknown as BufferExcelJs, outputCSVFolder, validHeaders, key);

            await this.processCSVFiles(csvFilePaths, fileName, key);

            await downloader.downloadDatabase(outputExcelFolder, key as 'gasolina' | 'acarreos' | 'concreto' | 'asfalto', fileName);

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

}

export default FileProcessor;