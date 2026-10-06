import ExcelJS from "exceljs";
import { promises as fs } from "fs";
import path from "path";

const outputPath = path.join(process.cwd(), "tenant-assets", "demo", "documents", "qr-template.xlsx");

const headers = [
  "Placas",
  "Operador",
  "Turno",
  "Localidad",
  "Frente",
  "No. Económico",
  "Cubicación",
  "Empresa",
  "No. Empleado",
];

const dummyRows = [
  ["ABC-123-D", "Operador Demo 01", 1, "Localidad Demo", "DEMO-F1", "ECO-001", 14.5, "Empresa Demo", "EMP-001"],
  ["XYZ-456-E", "Operador Demo 02", 2, "Localidad Demo", "DEMO-F2", "ECO-002", 12, "Empresa Demo", "EMP-002"],
  ["QRS-789-F", "Operador Demo 03", 1, "Localidad Norte", "DEMO-F3", "ECO-003", 16.25, "Transportes Demo", "EMP-003"],
];

async function createQrTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "White-label setup";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Camiones QR");
  worksheet.addRow(headers);
  dummyRows.forEach((row) => worksheet.addRow(row));

  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF133223" },
  };
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Created ${path.relative(process.cwd(), outputPath)}`);
}

createQrTemplate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
