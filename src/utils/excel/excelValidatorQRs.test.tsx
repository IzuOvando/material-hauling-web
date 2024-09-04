import XLSX from 'xlsx';
import { getMetadataCamionFromFile } from '@/utils/excel/excelValidatorQRs'
import MetaDataCamiones from '@/utils/qr/MetaDataCamiones';

const createMockFile = (name: string, type: string, contents: string | ArrayBuffer): File => {
    const blob = new Blob([contents], { type });
    return new File([blob], name, { type });
};

describe('getMetadataCamionFromFile', () => {
    console.log("1")
    const validHeaders = ["placas", "noeconomico", "operador", "turno", "frente", "volumen"];
    const validData = [
        ["ABC123", "001", "Juan Pérez", "Mañana", "Frente A", "100"],
        ["XYZ789", "002", "María López", "Tarde", "Frente B", "200"]
    ];
    console.log("2")
    beforeEach(() => {
        jest.clearAllMocks();
    });
    console.log("2")
    test('Debe resolver correctamente cuando el archivo contiene encabezados válidos y datos correctos', async () => {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([validHeaders, ...validData]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        const mockFile = createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);

        console.log("4")

        const result = await getMetadataCamionFromFile(mockFile);

        console.log("5")

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

    test('Debe rechazar cuando el archivo no se puede leer', async () => {
        const mockFile = createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'malformed data');

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow('Error al leer el archivo.');
    });

    test('Debe manejar correctamente el volumen como número y turno como número o string', async () => {
        const dataWithMixedTypes = [
            validHeaders,
            ["ABC123", "001", "Juan Pérez", 1, "Frente A", 100],
            ["XYZ789", "002", "María López", "2", "Frente B", "200"],
            ["DEF456", "003", "Carlos Gómez", 2, "Frente C", "300"],
            ["GHI123", "004", "Ana Silva", "1", "Frente D", 400],
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(dataWithMixedTypes);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        const mockFile = createMockFile('test-mixed-types.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', excelData);

        const result = await getMetadataCamionFromFile(mockFile);

        expect(result).toHaveLength(4);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
        expect(result[1]).toBeInstanceOf(MetaDataCamiones);
        expect(result[2]).toBeInstanceOf(MetaDataCamiones);
        expect(result[3]).toBeInstanceOf(MetaDataCamiones);
    });

    test('Debe manejar errores del lector de archivos', async () => {
        const mockFile = createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '');

        const originalFileReader = global.FileReader;

        const mockFileReader = {
            onload: jest.fn(),
            onerror: jest.fn(),
            readAsArrayBuffer: jest.fn(),
            result: null,
            readyState: 0,
            EMPTY: 0,
            LOADING: 1,
            DONE: 2,
        };

        global.FileReader = jest.fn().mockImplementation(() => mockFileReader) as any;

        await expect(getMetadataCamionFromFile(mockFile)).rejects.toThrow('Failed to read file.');

        global.FileReader = originalFileReader;
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

        const result = await getMetadataCamionFromFile(mockFile);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(MetaDataCamiones);
        expect(result[1]).toBeInstanceOf(MetaDataCamiones);
    });
});
