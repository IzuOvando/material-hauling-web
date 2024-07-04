import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '@/lib/db';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

interface DataRecord {
    empresa: string;
    material: string;
    cubicacion: string;
    fecha: string;
    placa: string;
    idCamion: string;
    operador: string;
    checador: string;
    hora: String;
    banco: String;
}

class FileProcessor {
    private prisma = prisma

    private toCamelCase(str: string): string {
        return str.replace(/\s(.)/g, (_, group1: string) => group1.toUpperCase())
            .replace(/\s/g, '')
            .replace(/^(.)/, (_, group1: string) => group1.toLowerCase());
    }

    private formatDate(value: number | string): string {
        if (typeof value === 'number') {
            const date = new Date(Date.UTC(0, 0, value - 1));
            return date.toISOString().slice(0, 10);
        }

        if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        return String(value);
    }

    public excelToCSV(inputFile: string, outputFolder: string): Promise<string[]> {
        const csvFilePaths: string[] = [];
        const inputFilePath = path.resolve(process.cwd(), inputFile);

        return new Promise((resolve, reject) => {
            fs.readFile(inputFilePath, (err, data) => {
                if (err) {
                    console.error('Error al leer el archivo:', err);
                    reject(err);
                    return;
                }

                try {
                    const workbook = XLSX.read(data, { type: 'buffer' });
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        if (!worksheet['!ref']) {
                            console.error(`Sheet ${sheetName} is empty or malformed.`);
                            return;
                        }

                        const range = XLSX.utils.decode_range(worksheet['!ref']);
                        let csvOutput = '';
                        let dateColumns = new Set<number>();

                        if (range.s.r <= range.e.r) {
                            let headerRow = [];
                            for (let C = range.s.c; C <= range.e.c; ++C) {
                                const headerCellRef = XLSX.utils.encode_cell({ c: C, r: range.s.r });
                                const headerCell = worksheet[headerCellRef];
                                let headerValue = headerCell ? headerCell.v : '';
                                headerRow.push(headerValue);
                                if (headerValue && typeof headerValue === 'string' && headerValue.toLowerCase().includes('fecha')) {
                                    dateColumns.add(C);
                                }
                            }
                            csvOutput += '"' + headerRow.map(this.toCamelCase).join('","') + '"\n';
                        }

                        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                            let row = [];
                            let isRowEmpty = true;
                            for (let C = range.s.c; C <= range.e.c; ++C) {
                                const cellAddress = { c: C, r: R };
                                const cellRef = XLSX.utils.encode_cell(cellAddress);
                                const cell = worksheet[cellRef];
                                let cellValue = cell ? cell.v : '';
                                if (cellValue) {
                                    isRowEmpty = false;
                                }
                                if (dateColumns.has(C)) {
                                    cellValue = this.formatDate(cellValue);
                                }
                                row.push('"' + cellValue + '"');
                            }
                            if (isRowEmpty) break;
                            csvOutput += row.join(',') + '\n';
                        }

                        const outputFilePath = path.join(outputFolder, `${sheetName.replace(/[\s\/]+/g, '_')}.csv`);
                        fs.writeFileSync(outputFilePath, csvOutput);
                        csvFilePaths.push(outputFilePath);
                    });

                    resolve(csvFilePaths);
                } catch (error) {
                    console.error('Error al procesar el archivo Excel:', error);
                    reject(error);
                }
            });
        });
    }

    public async csvToSQLite(csvFile: string) {
        const records: DataRecord[] = [];
        await new Promise<void>((resolve, reject) => {
            const stream = fs.createReadStream(csvFile)
                .pipe(csvParser())
                .on('data', (data: DataRecord) => records.push(data))
                .on('error', reject)
                .on('end', () => resolve());
        });

        try {
            for (const record of records) {
                await this.prisma.ticket.create({ data: record });
            }
            console.log('CSV data has been uploaded to SQLite');
        } catch (error) {
            console.error('Error during database insertion:', error);
            throw error;
        } finally {
            await this.prisma.$disconnect();
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
        const rootPath = path.resolve(process.cwd(), './');
        const outputFolder = path.resolve(rootPath, './db_output/csv/csv_output');

        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }
        try {
            const csvFilePaths = await this.excelToCSV('db_input/bbd.xlsx', outputFolder);
            await this.processCSVFiles(csvFilePaths);
        } catch (error) {
            console.error('Error during file processing:', error);
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