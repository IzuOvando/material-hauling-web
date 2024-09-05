import XLSX from 'xlsx';
import { getMetadataCamionFromFile } from '@/utils/excel/excelValidatorQRs'
import MetaDataCamiones from '@/utils/qr/MetaDataCamiones';
import { ValidationError } from '@/errors';

const createMockFile = (name: string, type: string, contents: ArrayBuffer): File => {
    const blob = new Blob([contents], { type });
    return new File([blob], name, { type });
};

describe('getMetadataCamionFromFile', () => {
    const validHeaders = ["placas", "noeconomico", "operador", "turno", "frente", "volumen"];
    const validData = [
        validHeaders,
        ["GHI123", "006", "Ana Silva", 1, "T9F7", 400],
        ["GHIJKD", "007", "Ana Silva", 2, "T3F5", 100],
    ];
    const invalidData = [
        validHeaders,
        ["ABC123", "001", "Juan Pérez", 1, "Frente A", 100],
        ["XYZ789", "002", "María López", "2", "Frente B", "200"],
        ["DEF456", "003", "Carlos Gómez", 2, "Frente C", "300"],
        ["GHI123", "004", "Ana Silva", "1", "Frente D", 400],
    ];
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debe resolver correctamente cuando el archivo contiene encabezados válidos y datos correctos', async () => {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(validData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        const mockFile = createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);

        const result = await getMetadataCamionFromFile(mockFile);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
        expect(result[1]).toBeInstanceOf(MetaDataCamiones);
    });

    test('Debe rechazar cuando el archivo tiene encabezados inválidos', async () => {
        const invalidHeaders = ["Placa", "NumEco", "Conductor", "Turno", "Frente de Trabajo", "Volumen"];
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([invalidHeaders, ...validData]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        const mockFile = createMockFile('test-invalid.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow("El encabezado del archivo no es válido.");
    });

    test('Debe manejar correctamente el volumen como número y turno como número o string', async () => {

        const workbookInvalid = XLSX.utils.book_new();
        const worksheetInvalid = XLSX.utils.aoa_to_sheet(invalidData);
        XLSX.utils.book_append_sheet(workbookInvalid, worksheetInvalid, 'Sheet1');
        const excelDataInvalid = XLSX.write(workbookInvalid, { bookType: 'xlsx', type: 'array' });
        const mockFileInvalid = createMockFile('test-invalid-types.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelDataInvalid);


        const workbookValid = XLSX.utils.book_new();
        const worksheetValid = XLSX.utils.aoa_to_sheet(validData);
        XLSX.utils.book_append_sheet(workbookValid, worksheetValid, 'Sheet1');
        const excelDataValid = XLSX.write(workbookValid, { bookType: 'xlsx', type: 'array' });
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
            ["ABC123", "", "Juan Pérez", "Mañana", "Frente A", "100"],
            ["", "", "", "", "", ""],
            ["XYZ789", "002", "María López", "Tarde", "Frente B", "200"]
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(dataWithEmptyRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        const mockFile = createMockFile('test-empty-rows.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);
        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow(ValidationError);

    });
});
