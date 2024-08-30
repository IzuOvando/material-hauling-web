import XLSX from 'xlsx';
import { schemas } from "@/lib/schemas/headers";

export function validateExcelFileQRs(file: File): Promise<void> {
    const validHeaders = schemas['camionesQR'];

    const isValidHeaderRow = (headers: string[], validHeaders: Set<string>): boolean => {
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

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    throw new Error('Error al leer el archivo.');
                }

                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetPromises = workbook.SheetNames.map(async (sheetName) => {
                    const worksheet = workbook.Sheets[sheetName];
                    if (!worksheet["!ref"]) {
                        console.error(`Sheet ${sheetName} is empty or malformed.`);
                        return;
                    }

                    const range = XLSX.utils.decode_range(worksheet["!ref"]);
                    let headerChecked = false;
                    let row: string[] = [];

                    for (let R = range.s.r; R <= range.e.r; ++R) {
                        row = [];
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

                            if (cellValue.trim() !== '') empty = false;
                        }

                        if (empty) continue;

                        if (!headerChecked) {
                            if (!isValidHeaderRow(row, validHeaders)) {
                                throw new Error("El encabezado del archivo no es válido.");
                            }
                            headerChecked = true;
                            continue;
                        }

                        // Process rows after header validation if needed
                        // For example, you might want to process the rows further
                    }
                });

                Promise.all(sheetPromises)
                    .then(() => resolve())
                    .catch((error) => reject(error));
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo.'));
        };

        reader.readAsArrayBuffer(file);
    });
}