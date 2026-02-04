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

describe('getMetadataCamionFromFile', () => {
    const validHeaders = ["placas", "noeconomico", "operador", "turno", "localidad", "frente", "cubicacion", "empresa", "noempleado"];
    const validData = [
        validHeaders,
        ["GHI123", "006", "Ana Silva", 1, "Localidad 1", "T9F7", "F1", 400, "Mabina SA de CV", "568TXP"],
        ["GHIJKD", "007", "Ana Silva", 2, "Localidad 2", "T3F5", "F2", 100, "Mabina SA de CV", "568TXP"],
    ];
    const invalidData = [
        validHeaders,
        ["ABC123", "001", "Juan Pérez", 5, "E1", "F1", 100, "Empresa A", "300"],
        ["XYZ789", "002", "María López", "2", "E2", "F2", "200", "Empresa B", "301"],
        ["DEF456", "003", "Carlos Gómez", 2, "E3", "F3", "300", "Empresa C", "302"],
        ["GHI123", "004", "Ana Silva", "1", "E4", "F4", 400, "Empresa D", "303"]
    ];
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe resolver correctamente cuando el archivo contiene encabezados válidos y datos correctos', async () => {
        const excelData = await createExcelBuffer(validData);

        const mockFile = createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);

        const result = await getMetadataCamionFromFile(mockFile);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
        expect(result[1]).toBeInstanceOf(MetaDataCamiones);
    });

    test('Debe rechazar cuando el archivo tiene encabezados inválidos', async () => {
        const invalidHeaders = ["Placa", "NumEco", "Conductor", "Turno", "Frente de Trabajo", "Volumen"];
        const excelData = await createExcelBuffer([invalidHeaders, ...validData]);

        const mockFile = createMockFile('test-invalid.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow("El encabezado del archivo no es válido.");
    });

    test('Debe manejar correctamente el volumen como número y turno como número o string', async () => {

        const excelDataInvalid = await createExcelBuffer(invalidData);
        const mockFileInvalid = createMockFile('test-invalid-types.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelDataInvalid);


        const excelDataValid = await createExcelBuffer(validData);
        const mockFileValid = createMockFile('test-valid-types.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelDataValid);

        await expect(getMetadataCamionFromFile(mockFileInvalid)).rejects.toThrow(ValidationError);

        const result = await getMetadataCamionFromFile(mockFileValid);
        expect(result).toHaveLength(2);
        result.forEach(item => expect(item).toBeInstanceOf(MetaDataCamiones));
    });


    test('Debe manejar correctamente filas vacías y celdas vacías', async () => {
        const dataWithEmptyRows = [
            validHeaders,
            [],
            ["ABC123", "", "Juan Pérez", "Mañana", "Frente A", "100", "Mabina SA de CV", "568TXP"],
            ["", "", "", "", "", "", "", ""],
            ["XYZ789", "002", "María López", "Tarde", "Frente B", "200", "Mabina SA de CV", "568TXP"]
        ];

        const excelData = await createExcelBuffer(dataWithEmptyRows);

        const mockFile = createMockFile('test-empty-rows.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);
        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);

    });
});
