import MetaDataCamiones from "@/utils/qr/MetaDataCamiones";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function getCamionesQRSVG(
  camiones: MetaDataCamiones[]
): Promise<void> {
  const zip = new JSZip();

  camiones.forEach((camion) => {
    zip.file(`QR_${camion.getIdCamion()}.svg`, camion.toQR());
  });

  const content = await zip.generateAsync({ type: "blob" });

  saveAs(content, "qrcodes.zip");
}
