import MetaDataCamiones from '@/utils/qr/MetaDataCamiones';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface MetaDataCamion {
    placas: string;
    volumen: number;
    noeconomico: string;
    operador: string;
    turno: number;
    frente: string | null;
    idcamion: string;
}

export async function getCamionesQRSVG(dataCamiones: MetaDataCamion[]): Promise<void> {
    const metaDataInstance = new MetaDataCamiones();

    try {
        const qrCodes = await metaDataInstance.generateQRCodes(dataCamiones);

        const zip = new JSZip();

        qrCodes.forEach((svgQRCode, index) => {
            zip.file(`QR_${index + 1}.svg`, svgQRCode);
        });

        const content = await zip.generateAsync({ type: 'blob' });

        saveAs(content, 'qrcodes.zip');
    } catch (error) {
        console.error('Error generating QR codes or ZIP:', error);
        throw error;
    }
}



