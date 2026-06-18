import { DatasetKey, DatasetConfig } from "@/types/types";
import {
  voucherCamionHeaderMap,
  voucherCamionStatusMap,
} from "./voucherCamion.config";
import {
  formatDateToDDMMYYYY,
  formatDateTimeToDDMMYYYY_HHMM,
  formatTime12Hour,
} from "@/helpers/formatters/datetime";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";

export const datasetConfigs: Record<DatasetKey, DatasetConfig> = {
  vouchercamion: {
    headerMap: voucherCamionHeaderMap,
    transforms: {
      Folio: (v) => (v ? formatVoucherId(String(v)) : v),

      "Created At": (v) => (v ? formatDateToDDMMYYYY(v) : v),
      "Voucher Datetime Date": (v) => {
        if (!v) return v;
        return formatDateToDDMMYYYY(v instanceof Date ? v : new Date(String(v)));
      },

      "Voucher Datetime Time": (v) => {
        if (!v) return v;
        return formatTime12Hour(v instanceof Date ? v : new Date(String(v)), true);
      },

      "Arrival Time": (v) => (v ? formatDateTimeToDDMMYYYY_HHMM(v) : v),

      Status: (v) => (v ? voucherCamionStatusMap[String(v)] ?? v : v),
    },
  },
};