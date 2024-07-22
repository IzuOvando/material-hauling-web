import * as fs from "fs";
import * as XLSX from "xlsx";
import * as path from "path";
import prisma from "@/lib/db";
import csvParser from "csv-parser";
import { schemas, SchemaKeys } from "@/lib/schemas/headers";
import { CreateTicketDto, filteredDataConfig, isCreateAcarreosDto, isCreateGasolinaDto } from '@/lib/schemas/csv_schemas';


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

    private formatDate(value: number | string): string {

        if (typeof value === "number") {
            const date = new Date(Date.UTC(0, 0, value - 1));
            const day = String(date.getUTCDate()).padStart(2, "0");
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const year = date.getUTCFullYear();
            return `${day}-${month}-${year}`;
        }

        if (typeof value === "string" && /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(value)) {
            const [month, day, year] = value.split("/");
            const fullYear = (parseInt(year) < 50 ? "20" : "19") + year.padStart(2, "0");
            return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
        }

        if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split("/");
            return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
        }

        if (typeof value === "string" && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
            const [day, month, year] = value.split("-");
            return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
        }

        return String(value);
    }

    private isDateColumn(value: string): boolean {
        return (
            /^\d{2}\/\d{2}\/\d{4}$/.test(value) ||
            /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(value) ||
            /^\d{2}-\d{2}-\d{4}$/.test(value)
        );
    }



    public excelToCSV(
        inputFile: string,
        outputFolder: string,
        validHeaders: Set<string>
    ): Promise<string[]> {
        const csvFilePaths: string[] = [];
        const inputFilePath = path.resolve(process.cwd(), inputFile);

        const isValidHeaderRow = (headers: string[]) => {
            const headerSet = new Set(headers.map((header) => header.toLowerCase()));
            return (
                Array.from(validHeaders).filter((header) => headerSet.has(header)).length >=
                validHeaders.size * 0.8
            );
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
                            }
                            if (!headerChecked) {
                                if (!isValidHeaderRow(row)) {
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
                                    cellValue = this.formatDate(cellValue.toString());
                                    cellValue = cellValue.replace(/"/g, '""');
                                    return `"${cellValue}"`;
                                }
                                if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('"'))) {
                                    cellValue = cellValue.replace(/"/g, '""');
                                    return `"${cellValue}"`;
                                }
                                return cellValue;
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
        return str.replace(/""/g, '"').replace(/^"|"$/g, '');
    };

    private getFilteredData(key: string, data: any, fileName: string): CreateTicketDto {
        const config = filteredDataConfig[key];
        if (!config) {
            throw new Error(`Unsupported key: ${key}`);
        }
        return config(data, fileName, this.cleanQuotes);
    }

    public async csvToSQLite(csvFile: string, fileName: string, key: string) {
        const records: CreateTicketDto[] = [];
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(csvFile)
                .pipe(csvParser())
                .on("data", (data: any) => {
                    try {
                        const filteredData = this.getFilteredData(key, data, fileName);
                        records.push(filteredData);
                    } catch (error) {
                        console.error("Error filtering data:", error);
                    }
                })
                .on("error", reject)
                .on("end", resolve);
        });

        try {

            const underscoreIndex = fileName.indexOf('_');
            const dotIndex = fileName.indexOf('.');
            const cleanFrenteName = fileName.substring(underscoreIndex + 1, dotIndex);

            if (!cleanFrenteName) {
                console.error(`No se pudo extraer un nombre válido del archivo: ${fileName}`);
                return;
            }

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

            for (const record of records) {
                try {
                    if (isCreateAcarreosDto(record)) {
                        const acarreo = await prisma.acarreos.create({
                            data: {
                                frenteNombre: record.frenteNombre,
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
                            },
                        });

                        await prisma.frente.update({
                            where: { nombre: record.frenteNombre },
                            data: {
                                ticketsAcarreos: {
                                    connect: { uuid: acarreo.uuid },
                                },
                            },
                        });
                    } else if (isCreateGasolinaDto(record)) {
                        const gasolina = await prisma.gasolina.create({
                            data: {
                                frenteNombre: record.frenteNombre,
                                empresa: record.empresa,
                                direccion: record.direccion,
                                litros: `${record.litros} m³`,
                                fecha: record.fecha,
                                placas: record.placas,
                                noEstacion: record.noEstacion,
                                noNota: record.noNota,
                                tipo: record.tipo,
                                precio: record.precio,
                                total: record.total,
                                hora: record.hora,
                                odometro: record.odometro,
                                bomba: record.bomba,
                                terminal: record.terminal,
                            },
                        });

                        await prisma.frente.update({
                            where: { nombre: record.frenteNombre },
                            data: {
                                ticketsGasolina: {
                                    connect: { uuid: gasolina.uuid },
                                },
                            },
                        });
                    } else {
                        throw new Error(`Unsupported record type: ${JSON.stringify(record)}`);
                    }
                } catch (error) {
                    console.error("Failed to create ticket:", error);
                    throw error;
                }
            }

            console.log("Los datos del CSV han sido cargados en SQLite");
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
                validHeaders
            );
            await this.processCSVFiles(csvFilePaths, fileName, key);
            await this.downloadDatabase(path.resolve(outputExcel), key)
            this.deleteFiles([path.resolve(outputFolder, `./db_input/${fileName}`), ...csvFilePaths]);
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

    private downloadDatabase(outputExcel: string, key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let records: any[];

            if (key === 'gasolina') {
                prisma.gasolina.findMany().then(res => {
                    records = res;
                    processRecords();
                }).catch(err => {
                    console.error("Error fetching 'gasolina' records:", err);
                    reject(err);
                });
            } else if (key === 'acarreos') {
                prisma.acarreos.findMany().then(res => {
                    records = res;
                    processRecords();
                }).catch(err => {
                    console.error("Error fetching 'acarreos' records:", err);
                    reject(err);
                });
            } else {
                reject(new Error(`Unsupported key: ${key}`));
            }

            function processRecords() {
                const worksheet = XLSX.utils.json_to_sheet(records);
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


    private deleteFiles(filePaths: string[]): void {
        filePaths.forEach((filePath) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${filePath}:`, err);
                    throw new Error(`Failed to delete file ${filePath}: ${err.message}`);
                } else {
                    console.log(`File ${filePath} deleted successfully.`);
                }
            });
        });
    }
}

export default FileProcessor;
