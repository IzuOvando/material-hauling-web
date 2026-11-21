import { DateTime } from "luxon";
import {
  formatMonthYear,
  formatRangeShort,
  isFullMonthRange,
  parseRange,
} from "@/actions/trucks/periods";
import whiteLabelConfig from "#/white-label.config";
import { FIELD_LABELS, TURNO_LABELS } from "./labels";

const { trucksFilters, filters: filterLabels } = whiteLabelConfig.ui;

const STATUS_TEXT: Record<string, string> = {
  IN_TRANSIT: trucksFilters.statusInTransit,
  ARRIVED: trucksFilters.statusArrived,
};

const LIST_FIELD_LABELS: Record<string, string> = {
  material: filterLabels.material,
  checkerName: filterLabels.departureChecker,
  arrivalCheckerName: filterLabels.arrivalChecker,
  frenteNombre: FIELD_LABELS.frenteNombre,
};

/**
 * Plain-text summary of a DB view filter string (`field=a^b|field2=c`), in the
 * same terms as the filter chips. It lists only what the server applies, so the
 * summary never promises a narrower selection than the one that is deleted.
 */
export function describeTrucksFilters(filters: string): string[] {
  const lines: string[] = [];

  for (const part of filters.split("|")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const field = part.slice(0, eq).trim();
    const values = part
      .slice(eq + 1)
      .split("^")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) continue;

    if (field === "voucherDatetimeRange") {
      const range = parseRange(values[0]);
      const valid =
        range &&
        DateTime.fromISO(range.from).isValid &&
        DateTime.fromISO(range.to).isValid;
      if (range && valid) {
        const text = isFullMonthRange(range) ? formatMonthYear(range) : formatRangeShort(range);
        lines.push(`${trucksFilters.periodLabelPrefix}: ${text}`);
      }
    } else if (field === "q") {
      lines.push(`${trucksFilters.searchLabelPrefix}: "${values[0]}"`);
    } else if (field === "status") {
      const known = values.filter((v) => v in STATUS_TEXT);
      if (known.length > 0) {
        lines.push(`${trucksFilters.statusLabelPrefix}: ${known.map((v) => STATUS_TEXT[v]).join(", ")}`);
      }
    } else if (field === "turno") {
      const known = values.filter((v) => v in TURNO_LABELS && v !== "ALL");
      if (known.length > 0) {
        lines.push(`${filterLabels.shift}: ${known.map((v) => TURNO_LABELS[v]).join(", ")}`);
      }
    } else if (LIST_FIELD_LABELS[field]) {
      lines.push(`${LIST_FIELD_LABELS[field]}: ${values.join(", ")}`);
    }
  }

  return lines;
}
