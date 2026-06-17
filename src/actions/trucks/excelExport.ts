import ExcelJS from "exceljs";
import type { VoucherCamion } from "@prisma/client";
import {
  formatDateToDDMMYYYY,
  formatDateTimeToDDMMYYYY_HHMM,
  formatTime12Hour,
} from "@/helpers/formatters/datetime";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";

const STATUS_LABELS: Record<string, string> = {
  IN_TRANSIT: "EN TRÁNSITO",
  ARRIVED: "ARRIBÓ",
};

interface ExportRow {
  label: string;
  value: (v: VoucherCamion) => string | number | null;
}

const COLUMNS: ExportRow[] = [
  { label: "Folio", value: (v) => formatVoucherId(v.folio) },
  { label: "Creado el", value: (v) => (v.createdAt ? formatDateToDDMMYYYY(v.createdAt) : "") },
  {
    label: "Fecha de elaboración del váucher",
    value: (v) => (v.voucherDatetime ? formatDateToDDMMYYYY(v.voucherDatetime) : ""),
  },
  {
    label: "Hora de elaboración del váucher",
    value: (v) => (v.voucherDatetime ? formatTime12Hour(v.voucherDatetime, true) : ""),
  },
  { label: "Estatus", value: (v) => STATUS_LABELS[v.status] ?? v.status },
  { label: "ID camión", value: (v) => v.idCamion },
  { label: "No. económico", value: (v) => v.noEconomico },
  { label: "Placas", value: (v) => v.placas },
  { label: "Material", value: (v) => v.material },
  { label: "Origen", value: (v) => v.origen },
  { label: "Destino", value: (v) => v.destino },
  { label: "Cubicación", value: (v) => v.cubicacion },
  { label: "Odómetro de Salida", value: (v) => v.odometer },
  { label: "Odómetro llegada", value: (v) => v.odometerArrival ?? "" },
  {
    label: "Fecha/Hora llegada",
    value: (v) => (v.arrivalTime ? formatDateTimeToDDMMYYYY_HHMM(v.arrivalTime) : ""),
  },
  { label: "Operador", value: (v) => v.operador },
  { label: "No. operador", value: (v) => v.noEmpleado },
  { label: "Turno", value: (v) => (v.turno === 1 ? "Primer" : v.turno === 2 ? "Segundo" : String(v.turno)) },
  { label: "Empresa", value: (v) => v.empresa },
  { label: "Localidad", value: (v) => v.localidad },
  { label: "Nombre checador salida", value: (v) => v.checkerName },
  { label: "No. checador salida", value: (v) => v.checkerNo ?? "" },
  { label: "Nombre checador llegada", value: (v) => v.arrivalCheckerName ?? "" },
  { label: "No. checador llegada", value: (v) => v.arrivalCheckerEmployeeNumber ?? "" },
  { label: "Frente", value: (v) => v.frenteNombre },
  { label: "Latitud", value: (v) => v.latitude ?? "" },
  { label: "Longitud", value: (v) => v.longitude ?? "" },
  { label: "Precisión de la ubicación", value: (v) => v.locationAccuracy ?? "" },
  { label: "Latitud de llegada", value: (v) => v.arrivalLatitude ?? "" },
  { label: "Longitud de llegada", value: (v) => v.arrivalLongitude ?? "" },
  { label: "Precisión de la ubicación de llegada", value: (v) => v.arrivalLocationAccuracy ?? "" },
];

export async function buildTrucksExcel(
  vouchers: VoucherCamion[],
  sheetName: string = "Vouchers"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = COLUMNS.map((col, idx) => ({
    header: col.label,
    key: col.label,
    width: idx === 0 ? 22 : undefined,
  }));

  for (const voucher of vouchers) {
    const row: Record<string, string | number | null> = {};
    for (const col of COLUMNS) {
      row[col.label] = col.value(voucher) as string | number | null;
    }
    worksheet.addRow(row);
  }

  worksheet.getRow(1).font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
