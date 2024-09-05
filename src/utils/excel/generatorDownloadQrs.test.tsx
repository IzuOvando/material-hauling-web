import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getCamionesQRSVG } from './generatorDownloadQrs';
import { ValidationError } from '@/errors';

jest.mock('jszip');
jest.mock('file-saver');

describe('getCamionesQRSVG', () => {
    const mockSaveAs = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
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
                frente: 'T6F9',
                idcamion: 'TM-FrenteA-001'
            },
            {
                placas: 'XYZ789',
                volumen: 200,
                noeconomico: '002',
                operador: 'María López',
                turno: 2,
                frente: 'T9F5',
                idcamion: 'TM-FrenteB-002'
            }
        ];

        await getCamionesQRSVG(mockDataCamiones);
        expect(JSZip.prototype.generateAsync).toHaveBeenCalledWith({ type: 'blob' });
        expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'qrcodes.zip');
    });

    test('Debe manejar errores con campos nulos', async () => {
        const mockDataCamiones = [
            {
                placas: 'ABC123',
                volumen: 100,
                noeconomico: '',
                operador: 'Juan Pérez',
                turno: 1,
                frente: '',
                idcamion: ''
            }
        ];

        await expect(getCamionesQRSVG(mockDataCamiones)).rejects.toThrow(ValidationError);

    });
});
