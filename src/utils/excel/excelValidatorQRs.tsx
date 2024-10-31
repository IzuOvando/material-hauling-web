import * as XLSX from "xlsx";
import { schemas } from "@/lib/schemas/headers";
import MetaDataCamiones from "@/utils/qr/MetaDataCamiones";

export function getMetadataCamionFromFile(
  file: File
): Promise<MetaDataCamiones[]> {
  const validHeaders = schemas["camionesQR"];

  const headerToFieldMap: { [key: string]: string } = {
    placas: "setPlacas",
    noeconomico: "setNoeconomico",
    operador: "setOperador",
    turno: "setTurno",
    frente: "setFrente",
    cubicacion: "setVolumen",
    empresa: "setEmpresa",
    noempleado: "setNoempleado"
  };

  const isValidHeaderRow = (
    headers: string[],
    validHeaders: Set<string>
  ): boolean => {
    const normalize = (header: string) =>
      header.replace(/\s+/g, "").toLowerCase();
    const cleanedHeaders = new Set(
      headers.map(normalize).filter((header) => header.length > 0)
    );
    const normalizedValidHeaders = new Set(
      Array.from(validHeaders).map(normalize)
    );

    for (const validHeader of normalizedValidHeaders) {
      if (!cleanedHeaders.has(validHeader)) {
        return false;
      }
    }
    return true;
  };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error("Error al leer el archivo.");
        }

        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const qrBuilders: MetaDataCamiones[] = [];

        const sheetPromises = workbook.SheetNames.map(async (sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet["!ref"]) {
            console.error(`Sheet ${sheetName} is empty or malformed.`);
            return;
          }

          const range = XLSX.utils.decode_range(worksheet["!ref"]);
          let headerChecked = false;
          let headers: string[] = [];

          for (let R = range.s.r; R <= range.e.r; ++R) {
            let row: string[] = [];
            let empty = true;

            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = { c: C, r: R };
              const cellRef = XLSX.utils.encode_cell(cellAddress);
              const cell = worksheet[cellRef];
              let cellValue = cell ? cell.w || cell.v : "";

              if (typeof cellValue === "string") {
                cellValue = cellValue.replace(/"/g, '""');
                if (cellValue.includes(",") || cellValue.includes('"')) {
                  cellValue = `"${cellValue}"`;
                }
              }

              row.push(cellValue);

              if (cellValue.trim() !== "") empty = false;
            }

            if (empty) continue;

            if (!headerChecked) {
              headers = row;
              if (!isValidHeaderRow(headers, validHeaders)) {
                throw new Error("El encabezado del archivo no es válido.");
              }
              headerChecked = true;
              continue;
            }

            const qrBuilder = new MetaDataCamiones();

            headers.forEach((header, index) => {
              const normalizedHeader = header.trim().toLowerCase().replace(/\s+/g, "");
              const field = Object.keys(headerToFieldMap).find((key) =>
                normalizedHeader.includes(key)
              );
              if (field) {
                const methodName = headerToFieldMap[field];
                const method = (qrBuilder as any)[methodName];
                if (typeof method === "function") {
                  method.call(qrBuilder, row[index]);
                }
              }
            });

            qrBuilder.build();
            qrBuilders.push(qrBuilder);
          }
        });

        Promise.all(sheetPromises)
          .then(() => resolve(qrBuilders))
          .catch((error) => reject(error));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    reader.readAsArrayBuffer(file);
  });
}
