import * as fs from "fs";
import * as XLSX from "xlsx";
import * as path from "path";
import prisma from "@/lib/db";
import csvParser from "csv-parser";
import { promisify } from 'util';
import { schemas, SchemaKeys } from "@/lib/schemas/headers";
import { CreateTicketDto, filteredDataConfig, isCreateAcarreosDto, isCreateGasolinaDto } from '@/lib/schemas/csv_schemas';
import CONFIG from "@/config";

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

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


    public excelToCSV(
        inputFile: string,
        outputFolder: string,
        validHeaders: Set<string>,
        key: string
    ): Promise<string[]> {
        const csvFilePaths: string[] = [];
        const inputFilePath = path.resolve(process.cwd(), inputFile);

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



        const formatTime = (timeStr: string): string => {
            const match = timeStr.match(/^(\d{2}:\d{2}):\d{2} (a\. m\.|p\. m\.)$/);
            if (match) {
                return `${match[1]} ${match[2]}`;
            }
            return timeStr;
        };

        return new Promise((resolve, reject) => {
            fs.readFile(inputFilePath, (err, data) => {
                if (err) {
                    console.error("Error reading the file:", err);
                    reject(err);
                    return;
                }

                try {
                    const workbook = XLSX.read(data, { type: "buffer" });
                    workbook.SheetNames.forEach((sheetName) => {
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
                                return formatTime(cellValue);
                            });
                            csvOutput += row.join(",") + "\n";
                        }

                        const fileNameWithoutExtension = path.basename(inputFile, path.extname(inputFile));
                        const match = fileNameWithoutExtension.match(/_(.*)/);
                        const extractedPart = match ? match[1] : '';
                        const outputFilePath = path.join(
                            outputFolder,
                            `${extractedPart}_${sheetName.replace(/[\s\/]+/g, "_")}.csv`
                        );
                        if (!csvOutput || csvOutput.trim() === '') {
                            throw new Error(`El archivo CSV para ${sheetName} está vacío.`);
                        }
                        fs.writeFileSync(outputFilePath, csvOutput);
                        csvFilePaths.push(outputFilePath);
                    });

                    resolve(csvFilePaths);
                } catch (error) {
                    console.error("Error al procesar el archivo Excel:", error);
                    reject(error);
                }
            });
        });
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
                        folio: string;
                        empresa: string;
                        material: string;
                        cubicacion: string;
                        fecha: string;
                        placas: string;
                        idCamion: string;
                        operador: string;
                        proyecto: string;
                        noEmpleado: string;
                        checador: string;
                        hora: string;
                        banco: string;
                    } = {
                        frenteNombre: record.frenteNombre,
                        folio: record.folio,
                        empresa: record.empresa,
                        material: record.material,
                        cubicacion: `${record.cubicacion} m³`,
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
                        folio: string;
                        saldoCompra: string;
                        formatoPago: string;
                        litros: string;
                        fecha: string;
                        placas: string;
                        autorizacion: string;
                        total: string;
                        hora: string;
                        bomba: string;
                        precioUnitario: string;
                    } = {
                        frenteNombre: record.frenteNombre,
                        folio: record.folio,
                        saldoCompra: record.saldoCompra,
                        formatoPago: record.formatoPago,
                        litros: `${record.litros} L`,
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
        let records: CreateTicketDto[] = [];
        let activeBatches = 0;

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
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
                });
            } else if (key === 'acarreos') {
                await prisma.acarreos.deleteMany({
                    where: {
                        frenteNombre: cleanFrenteName,
                    },
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

            await new Promise<void>((resolve, reject) => {
                const stream = fs.createReadStream(csvFile).pipe(csvParser());
                stream.on("data", async (data: any) => {
                    stream.pause();
                    try {
                        const filteredData: CreateTicketDto = this.getFilteredData(key, data, fileName);
                        records.push(filteredData);
                        if (records.length >= batchSize) {
                            activeBatches++;
                            try {
                                await this.processBatch(records, cleanFrenteName, key);
                            } catch (error) {
                                if (error instanceof Error) {
                                    stream.destroy(error);
                                } else {
                                    stream.destroy(new Error(`Non-error thrown: ${error}`));
                                }
                                reject(error);
                                return;
                            }
                            records = [];
                            activeBatches--;
                        }
                        stream.resume();
                    } catch (error) {
                        console.error("Error processing data:", error);
                        if (error instanceof Error) {
                            stream.destroy(error);
                        } else {
                            stream.destroy(new Error(`Non-error thrown: ${error}`));
                        }
                    }
                })
                    .on("error", error => {
                        console.error(`Error al procesar el archivo CSV: ${error}`);
                        reject(error);
                    })
                    .on("end", async () => {
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

    public async processFiles(fileName: string, area: string) {
        const rootPath = path.resolve(process.cwd(), "./");
        const outputFolder = path.resolve(rootPath, "./db_output/csv/csv_output");
        const dbInputPath = path.resolve(rootPath, "./db_input");
        const desiredPart = fileName.split('_')[1].split('.')[0];
        const outputExcel = path.resolve(rootPath, `./db_output/excel/${desiredPart}`);
        if (!fs.existsSync(outputExcel)) {
            fs.mkdirSync(outputExcel, { recursive: true });
        }

        const key = area.toLowerCase()
        if (!this.isValidKey(key)) {
            console.error(`Invalid area type: ${key}`);
            throw new Error(`Invalid area type: ${key}`);
        }
        const validHeaders = schemas[key];
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }
        try {
            const csvFilePaths = await this.excelToCSV(
                `./db_input/${fileName}`,
                outputFolder,
                validHeaders,
                key
            );
            await this.processCSVFiles(csvFilePaths, fileName, key);
            await this.downloadDatabase(path.resolve(outputExcel), key, fileName)
            this.deleteFiles([dbInputPath, outputFolder])
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


    private downloadDatabase(outputExcel: string, key: string, fileName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let records: any[];
            const underscoreIndex = fileName.indexOf('_');
            const dotIndex = fileName.indexOf('.');
            const cleanFrenteName = fileName.substring(underscoreIndex + 1, dotIndex);
            if (key === 'gasolina') {
                prisma.gasolina.findMany({
                    where: {
                        frenteNombre: cleanFrenteName
                    }
                }).then(res => {
                    records = res;
                    processRecords();
                }).catch(err => {
                    console.error("Error fetching 'gasolina' records:", err);
                    reject(err);
                });
            } else if (key === 'acarreos') {
                prisma.acarreos.findMany({
                    where: {
                        frenteNombre: cleanFrenteName
                    }
                }).then(res => {
                    records = res;
                    processRecords();
                }).catch(err => {
                    console.error("Error fetching 'acarreos' records:", err);
                    reject(err);
                });
            } else {
                reject(new Error(`Unsupported key: ${key}`));
            }
            const processRecords = () => {
                const processedRecords = records.map(record => {
                    const updatedRecord: any = {};
                    Object.keys(record).forEach(data => {
                        const newKey = this.convertCamelCaseToSpaces(data);
                      
                        let value = record[data];

                        if (newKey.toLowerCase().includes('uuid')) {
                            value = value.toString();
                        }

                        updatedRecord[newKey] = value;

                        if (key === 'acarreos' && newKey.toLowerCase() === 'cubicacion' && updatedRecord[newKey]) {
                            updatedRecord[newKey] = updatedRecord[newKey].replace(/m³/g, '').trim();
                        }

                        if (key === 'gasolina' && newKey.toLowerCase() === 'litros' && updatedRecord[newKey]) {
                            updatedRecord[newKey] = updatedRecord[newKey].replace(/L/g, '').trim();
                        }
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
                const outputFilePath = path.resolve(outputExcel, filename);
                const dirPath = path.dirname(outputFilePath);

                fs.mkdir(dirPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error("Failed to create directory:", err);
                        reject(err);
                        return;
                    }

                    fs.stat(dirPath, (err, stats) => {
                        if (err || !stats.isDirectory()) {
                            console.error("Directory validation failed:", err);
                            reject(err);
                            return;
                        }

                        const buffer = XLSX.write(workbook, { type: 'buffer' });
                        fs.writeFile(outputFilePath, buffer, (err) => {
                            if (err) {
                                console.error("Failed to write Excel file:", err);
                                reject(err);
                                return;
                            }
                            console.log('Database has been downloaded as Excel');
                            resolve();
                        });
                    });
                });
            }
        });
    }



    private async deleteFiles(directories: string[]): Promise<void> {
        for (const directory of directories) {
            try {
                const files = await readdir(directory);
                await Promise.all(files.map(file => {
                    const filePath = path.join(directory, file);
                    return unlink(filePath).then(() => {
                        console.log(`File ${filePath} deleted successfully.`);
                    }).catch(err => {
                        console.error(`Error deleting file ${filePath}:`, err);
                        throw new Error(`Failed to delete file ${filePath}: ${err.message}`);
                    });
                }));
            } catch (err) {
                console.error(`Error accessing directory ${directory}:`, err);
                throw err;
            }
        }
    }
}

export default FileProcessor;