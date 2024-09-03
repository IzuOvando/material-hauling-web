import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import MetaDataCamiones from '@/utils/qr/MetaDataCamiones';
import { generateQRString } from '@/utils/qr/QRGenerate';

// Mocks
jest.mock('@/utils/qr/MetaDataCamiones');
jest.mock('jszip');
jest.mock('file-saver');

describe('getCamionesQRSVG', () => {
    const mockGenerateQRCodes = jest.fn();
    const mockSaveAs = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock de la instancia de MetaDataCamiones
        MetaDataCamiones.prototype.generateQRCodes = mockGenerateQRCodes;

        // Mock de JSZip
        JSZip.prototype.generateAsync = jest.fn().mockResolvedValue(new Blob());

        // Mock de file-saver
        (saveAs as unknown as jest.Mock).mockImplementation(mockSaveAs);
    });

    test('Debe generar códigos QR y descargar un archivo ZIP', async () => {
        const mockDataCamiones = [
            {
                placas: 'ABC123',
                volumen: 100,
                noeconomico: '001',
                operador: 'Juan Pérez',
                turno: 1,
                frente: 'Frente A',
                idcamion: 'TM-FrenteA-001'
            },
            {
                placas: 'XYZ789',
                volumen: 200,
                noeconomico: '002',
                operador: 'María López',
                turno: 2,
                frente: 'Frente B',
                idcamion: 'TM-FrenteB-002'
            }
        ];

        const mockQRCodes = ['<svg>QR1</svg>', '<svg>QR2</svg>'];
        mockGenerateQRCodes.mockResolvedValue(mockQRCodes);

        await generateQRString(mockDataCamiones);

        // Verifica que se haya llamado a generateQRCodes con los datos correctos
        expect(mockGenerateQRCodes).toHaveBeenCalledWith(mockDataCamiones);

        // Verifica que JSZip.generateAsync se haya llamado con el tipo 'blob'
        expect(JSZip.prototype.generateAsync).toHaveBeenCalledWith({ type: 'blob' });

        // Verifica que saveAs se haya llamado con el contenido correcto
        expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'qrcodes.zip');
    });

    test('Debe manejar errores en la generación de códigos QR o en la creación del archivo ZIP', async () => {
        const mockDataCamiones = [
            {
                placas: 'ABC123',
                volumen: 100,
                noeconomico: '001',
                operador: 'Juan Pérez',
                turno: 1,
                frente: 'Frente A',
                idcamion: 'TM-FrenteA-001'
            }
        ];

        // Configura el mock para que genere un error
        mockGenerateQRCodes.mockRejectedValue(new Error('Error generating QR codes'));

        await expect(generateQRString(mockDataCamiones)).rejects.toThrow('Error generating QR codes');
    });
});
