import { DatasetKey, DatasetConfig } from "@/types/types";
import {
  voucherCamionHeaderMap,
  voucherCamionStatusMap,
} from "./voucherCamion.config";
import {
  formatDateToDDMMYYYY,
  formatDateTimeToDDMMYYYY_HHMM,
  formatIsoDateFromString,
  formatTime12Hour,
} from "@/helpers/formatters/datetime";
import { DateTime } from "luxon";

export const datasetConfigs: Record<DatasetKey, DatasetConfig> = {
  gasolina: {},
  acarreos: {},
  concreto: {},
  asfalto: {},

  vouchercamion: {
    headerMap: voucherCamionHeaderMap,
    transforms: {
      Uuid: (v) => (v ? String(v) : v),

      "Created At": (v) => (v ? formatDateToDDMMYYYY(v) : v),
      "Voucher Date": (v) => {
        if (!v) return v;

        if (typeof v === "string" && v.includes("T")) return formatIsoDateFromString(v);

        if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

        if (v instanceof Date) {
          return DateTime.fromJSDate(v, { zone: "utc" }).toISODate();
        }

        return String(v);
      },

      "Voucher Time": (v) => {
        if (!v) return v;
        return formatTime12Hour(v);
      },

      "Arrival Time": (v) => (v ? formatDateTimeToDDMMYYYY_HHMM(v) : v),

      Status: (v) => (v ? voucherCamionStatusMap[String(v)] ?? v : v),
    },
  },
};