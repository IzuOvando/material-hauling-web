import ExcelJS from "exceljs";
import { schemas } from "@/lib/schemas/headers";
import MetaDataCamiones from "@/utils/qr/MetaDataCamiones";

function getCellStringValue(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object' && 'richText' in value) {
    return (value as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join('');
  }
  if (typeof value === 'object' && 'text' in value) {
    return (value as ExcelJS.CellHyperlinkValue).text;
  }
  if (typeof value === 'object' && 'result' in value) {
    const result = (value as ExcelJS.CellFormulaValue).result;
    if (result === null || result === undefined) return "";
    return String(result);
  }
  return String(value);
}

export function getMetadataCamionFromFile(
  file: File
): Promise<MetaDataCamiones[]> {
  const validHeaders = schemas["camionesQR"];

  const headerToFieldMap: { [key: string]: string } = {
    placas: "setPlacas",
    noeconomico: "setNoeconomico",
    operador: "setOperador",
    turno: "setTurno",
    localidad: "setLocalidad",
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

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error("Error al leer el archivo.");
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const qrBuilders: MetaDataCamiones[] = [];

        for (const worksheet of workbook.worksheets) {
          if (worksheet.rowCount === 0) {
            console.error(`Sheet ${worksheet.name} is empty or malformed.`);
            continue;
          }

          const colCount = worksheet.columnCount;
          let headerChecked = false;
          let headers: string[] = [];

          for (let R = 1; R <= worksheet.rowCount; ++R) {
            let row: string[] = [];
            let empty = true;

            for (let C = 1; C <= colCount; ++C) {
              const cell = worksheet.getRow(R).getCell(C);
              let cellValue = getCellStringValue(cell);

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
        }

        resolve(qrBuilders);
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
