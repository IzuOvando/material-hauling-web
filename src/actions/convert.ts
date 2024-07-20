import * as fs from "fs";
import * as XLSX from "xlsx";
import * as path from "path";
import prisma from "@/lib/db";
import csvParser from "csv-parser";
import { Prisma } from "@prisma/client";
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

            await prisma.ticket.deleteMany({
                where: {
                    frenteNombre: cleanFrenteName,
                    tipo: key,
                }
            });

            const frente = await prisma.frente.findUnique({
                where: { nombre: cleanFrenteName }
            });

            if (!frente) {
                console.error(`No se encontró el frente con el nombre: ${cleanFrenteName}`);
                return;
            }

            for (const record of records) {
                let idAcarreo = null;
                let idGasolina = null;
                if (isCreateAcarreosDto(record)) {
                    const acarreo = await prisma.acarreos.create({
                        data: {
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
                    idAcarreo = acarreo.id;
                } else if (isCreateGasolinaDto(record)) {
                    const gasolina = await prisma.gasolina.create({
                        data: {
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
                    idGasolina = gasolina.id;
                } else {
                    throw new Error(`Unsupported key: ${key}`);
                }
                const dataToInsert: Prisma.TicketCreateInput = {
                    tipo: key,
                    ...(idAcarreo ? { acarreos: { connect: { id: idAcarreo } } } : {}),
                    ...(idGasolina ? { gasolina: { connect: { id: idGasolina } } } : {}),
                    frenteGasolina: key === "gasolina" ? { connect: { nombre: cleanFrenteName } } : undefined,
                    frenteAcarreos: key === "acarreos" ? { connect: { nombre: cleanFrenteName } } : undefined,
                };

                if (key === "gasolina") {
                    (dataToInsert as Prisma.TicketCreateInput).frenteGasolina = {
                        connect: { nombre: cleanFrenteName },
                    };
                } else if (key === "acarreos") {
                    (dataToInsert as Prisma.TicketCreateInput).frenteAcarreos = {
                        connect: { nombre: cleanFrenteName },
                    };
                }

                try {
                    const createdTicket = await prisma.ticket.create({
                        data: dataToInsert,
                    });
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
