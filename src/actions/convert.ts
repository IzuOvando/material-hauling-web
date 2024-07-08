import * as fs from "fs";
import * as XLSX from "xlsx";
import * as path from "path";
import prisma from "@/lib/db";
import csvParser from "csv-parser";
import dotenv from "dotenv";

dotenv.config();

interface DataRecord {
    empresa: string;
    material: string;
    cubicacion: string;
    fecha: string;
    placas: string;
    idCamion: string;
    operador: string;
    checador: string;
    hora: string;
    banco: string;
    proyecto: string;
    noEmpleado: string;
}

class FileProcessor {
    private prisma = prisma;

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
        outputFolder: string
    ): Promise<string[]> {
        const csvFilePaths: string[] = [];
        const inputFilePath = path.resolve(process.cwd(), inputFile);

        const validHeaders = new Set([
            "id",
            "union",
            "n°",
            "#vd",
            "id camion",
            "num. eco.",
            "placas",
            "cubicacion",
            "fecha",
            "material",
            "banco",
            "hora",
            "no. empleado",
            "operador",
            "turno",
            "checador",
            "empresa",
            "proyecto",
            "no empleado",
            "proyecto",
        ]);

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
                                    cellValue = cellValue.replace(/"/g, '""'); // Escapa las comillas dobles internas
                                    if (cellValue.includes(',') || cellValue.includes('"')) {
                                        cellValue = `"${cellValue}"`; // Envuelve entre comillas si contiene comas o comillas dobles
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

                        const outputFilePath = path.join(
                            outputFolder,
                            `${sheetName.replace(/[\s\/]+/g, "_")}.csv`
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

    public async csvToSQLite(csvFile: string) {
        const records: DataRecord[] = [];
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(csvFile)
                .pipe(csvParser())
                .on("data", (data: any) => {
                    const filteredData: DataRecord = {
                        empresa: this.cleanQuotes(data.empresa),
                        material: this.cleanQuotes(data.material),
                        cubicacion: this.cleanQuotes(data.cubicacion),
                        fecha: this.cleanQuotes(data.fecha),
                        placas: this.cleanQuotes(data.placas),
                        idCamion: this.cleanQuotes(data.idCamion),
                        operador: this.cleanQuotes(data.operador),
                        proyecto: this.cleanQuotes(data.proyecto),
                        noEmpleado: this.cleanQuotes(data.noEmpleado),
                        checador: this.cleanQuotes(data.checador),
                        hora: this.cleanQuotes(data.hora),
                        banco: this.cleanQuotes(data.banco),
                    };
                    records.push(filteredData);
                })
                .on("error", reject)
                .on("end", resolve);
        });
        try {
            await this.prisma.$transaction(async (prisma) => {
                await prisma.ticket.deleteMany({});
                for (const record of records) {
                    await prisma.ticket.create({ data: record });
                }
            });
            console.log("CSV data has been uploaded to SQLite");
        } catch (error) {
            console.error("Error during database insertion:", error);
            throw error;
        }
    }

    // public async downloadDatabase(outputFile: string) {
    //     const users = await this.prisma.ticket.findMany();
    //     const worksheet = XLSX.utils.json_to_sheet(users);
    //     const workbook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    //     XLSX.writeFile(workbook, outputFile);
    //     console.log('Database has been downloaded as Excel');
    // }

    public async processFiles() {
        const rootPath = path.resolve(process.cwd(), "./");
        const outputFolder = path.resolve(rootPath, "./db_output/csv/csv_output");

        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }
        try {
            const csvFilePaths = await this.excelToCSV(
                "db_input/bbd.xlsx",
                outputFolder
            );
            await this.processCSVFiles(csvFilePaths);
        } catch (error) {
            console.error("Error during file processing:", error);
            throw error;
        }
    }

    private async processCSVFiles(csvFilePaths: string[]) {
        for (const csvFilePath of csvFilePaths) {
            await this.csvToSQLite(csvFilePath);
        }
    }
}

export default FileProcessor;
