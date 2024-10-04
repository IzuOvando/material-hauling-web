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
        cubicacion: 100,
        noeconomico: "001",
        operador: "Juan Pérez",
        turno: 1,
        frente: "T6F9",
        empresa: "Mabina SA de CV",
        noempleado: "568TXP"
      },
      {
        placas: "XYZ789",
        cubicacion: 200,
        noeconomico: "002",
        operador: "María López",
        turno: 2,
        frente: "T9F5",
        empresa: "Mabina SA de CV",
        noempleado: "568TXP"
      },
    ];

    const metadatas = camiones.map((camion) =>
      new MetaDataCamiones()
        .setPlacas(camion.placas)
        .setVolumen(camion.cubicacion)
        .setNoeconomico(camion.noeconomico)
        .setOperador(camion.operador)
        .setTurno(camion.turno)
        .setFrente(camion.frente)
        .setEmpresa(camion.empresa)
        .setNoempleado(camion.noempleado)
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
          .setEmpresa("")
          .setNoempleado("")
          .build(),
      ];
      getCamionesQRSVG(mockDataCamiones);
    }).toThrow(ValidationError);
  });
});
