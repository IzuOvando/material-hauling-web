import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getCamionesQRSVG } from "./generatorDownloadQrs";
import { ValidationError } from "@/errors";
import MetaDataCamiones from "../qr/MetaDataCamiones";

jest.mock("jszip");
jest.mock("file-saver");

describe("getCamionesQRSVG", () => {
  const mockSaveAs = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    JSZip.prototype.generateAsync = jest.fn().mockResolvedValue(new Blob());
    (saveAs as unknown as jest.Mock).mockImplementation(mockSaveAs);
  });

  test("Debe generar códigos QR y descargar un archivo ZIP", async () => {
    const camiones = [
      {
        placas: "ABC123",
        volumen: 100,
        noeconomico: "001",
        operador: "Juan Pérez",
        turno: 1,
        frente: "T6F9",
      },
      {
        placas: "XYZ789",
        volumen: 200,
        noeconomico: "002",
        operador: "María López",
        turno: 2,
        frente: "T9F5",
      },
    ];

    const metadatas = camiones.map((camion) =>
      new MetaDataCamiones()
        .setPlacas(camion.placas)
        .setVolumen(camion.volumen)
        .setNoeconomico(camion.noeconomico)
        .setOperador(camion.operador)
        .setTurno(camion.turno)
        .setFrente(camion.frente)
        .build()
    );

    await getCamionesQRSVG(metadatas);
    expect(JSZip.prototype.generateAsync).toHaveBeenCalledWith({
      type: "blob",
    });
    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), "qrcodes.zip");
  });

  test("Debe manejar errores con campos nulos", async () => {
    await expect(() => {
      const mockDataCamiones = [
        new MetaDataCamiones()
          .setPlacas("ABC123")
          .setVolumen(100)
          .setNoeconomico("")
          .setOperador("Juan Pérez")
          .setTurno(1)
          .setFrente("")
          .build(),
      ];
      getCamionesQRSVG(mockDataCamiones);
    }).toThrow(ValidationError);
  });
});
