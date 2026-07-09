import ExcelJS from 'exceljs';
import { getMetadataCamionFromFile } from '@/utils/excel/excelValidatorQRs'
import MetaDataCamiones from '@/utils/qr/MetaDataCamiones';
import { ValidationError } from '@/errors';

async function createExcelBuffer(data: any[][]): Promise<ArrayBuffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    for (const row of data) {
        worksheet.addRow(row);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as ArrayBuffer;
}

const createMockFile = (name: string, type: string, contents: ArrayBuffer): File => {
    const blob = new Blob([contents], { type });
    return new File([blob], name, { type });
};

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('getMetadataCamionFromFile', () => {
    const validHeaders = ["placas", "noeconomico", "operador", "turno", "localidad", "frente", "cubicacion", "empresa", "noempleado"];

    const validData = [
        validHeaders,
        ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", 400, "Mabina SA de CV", "568TXP"],
        ["GHIJKD", "007", "Carlos Ruiz", 2, "Localidad 2", "SDN-F2", 100, "Mabina SA de CV", "568TXP"],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Caso feliz ---

    test('Debe resolver correctamente cuando el archivo contiene encabezados válidos y datos correctos', async () => {
        const excelData = await createExcelBuffer(validData);
        const mockFile = createMockFile('test.xlsx', XLSX_TYPE, excelData);

        const result = await getMetadataCamionFromFile(mockFile);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
        expect(result[1]).toBeInstanceOf(MetaDataCamiones);
    });

    // --- Encabezados ---

    test('Debe rechazar cuando el archivo tiene encabezados inválidos', async () => {
        const invalidHeaders = ["Placa", "NumEco", "Conductor", "Turno", "Frente de Trabajo", "Volumen"];
        const excelData = await createExcelBuffer([invalidHeaders, ...validData]);
        const mockFile = createMockFile('test-invalid.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow("El encabezado del archivo no es válido.");
    });

    // --- Turno ---

    test('Debe rechazar cuando el turno es inválido (distinto de 1 o 2)', async () => {
        const data = [
            validHeaders,
            ["ABC123", "001", "Juan Pérez", 5, "Localidad 1", "SDN-F1", 100, "Empresa A", "300"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-turno-invalido.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });

    test('Debe aceptar turno como string "1" o "2"', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", "1", "Localidad 1", "SDN-F1", 400, "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-turno-string.xlsx', XLSX_TYPE, excelData);

        const result = await getMetadataCamionFromFile(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
    });

    // --- Cubicación: casos inválidos ---

    test('Debe rechazar cubicacion con texto no numérico "no aplica"', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", "no aplica", "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-cubicacion-noapl.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });

    test('Debe rechazar cubicacion con "NaN"', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", "NaN", "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-cubicacion-nan.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });

    test('Debe rechazar cubicacion con "sin registro"', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", "sin registro", "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-cubicacion-sinreg.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });

    test('Debe rechazar cubicacion igual a 0', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", 0, "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-cubicacion-cero.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });

    test('Debe rechazar cubicacion negativa', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", -10, "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-cubicacion-neg.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });

    // --- Cubicación: casos válidos ---

    test('Debe aceptar cubicacion como string decimal válido', async () => {
        const data = [
            validHeaders,
            ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "SDN-F1", "10.5", "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(data);
        const mockFile = createMockFile('test-cubicacion-decimal.xlsx', XLSX_TYPE, excelData);

        const result = await getMetadataCamionFromFile(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
    });

    // --- Filas vacías ---

    test('Debe manejar correctamente filas vacías y rechazar si faltan campos requeridos', async () => {
        const dataWithEmptyRows = [
            validHeaders,
            [],
            ["ABC123", "", "Juan Pérez", 1, "Localidad A", "SDN-F1", 100, "Mabina SA de CV", "568TXP"],
            ["", "", "", "", "", "", "", "", ""],
            ["XYZ789", "002", "María López", 1, "Localidad B", "SDN-F2", 200, "Mabina SA de CV", "568TXP"],
        ];
        const excelData = await createExcelBuffer(dataWithEmptyRows);
        const mockFile = createMockFile('test-empty-rows.xlsx', XLSX_TYPE, excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);
    });
});
