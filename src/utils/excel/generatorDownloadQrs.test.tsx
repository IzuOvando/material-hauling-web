import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import MetaDataCamiones from '@/utils/qr/MetaDataCamiones';
import { getCamionesQRSVG } from './generatorDownloadQrs';

jest.mock('jszip');
jest.mock('file-saver');

describe('getCamionesQRSVG', () => {
    const mockGenerateQRCodes = jest.fn();
    const mockSaveAs = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        MetaDataCamiones.prototype.generateQRCodes = mockGenerateQRCodes;
        JSZip.prototype.generateAsync = jest.fn().mockResolvedValue(new Blob());
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

        await getCamionesQRSVG(mockDataCamiones);

        expect(mockGenerateQRCodes).toHaveBeenCalledWith(mockDataCamiones);
        expect(JSZip.prototype.generateAsync).toHaveBeenCalledWith({ type: 'blob' });
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

        mockGenerateQRCodes.mockRejectedValue(new Error('Error generating QR codes'));

        await expect(getCamionesQRSVG(mockDataCamiones)).rejects.toThrow('Error generating QR codes');
    });
});
