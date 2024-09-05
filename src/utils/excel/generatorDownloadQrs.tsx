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
    const qrCodes = MetaDataCamiones.generateQRCodes(dataCamiones);
    const zip = new JSZip()
    qrCodes.forEach((svgQRCode, index) => {
        const idcamion = dataCamiones[index]?.idcamion;
        zip.file(`QR_${idcamion}.svg`, svgQRCode);
    });

    const content = await zip.generateAsync({ type: 'blob' });

    saveAs(content, 'qrcodes.zip');
}



