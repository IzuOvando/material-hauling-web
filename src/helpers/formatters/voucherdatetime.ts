import { VoucherDateTimeError } from "@/errors";
import { DateTime } from "luxon";
import CONFIG from "@/config";

export class VoucherDateTimeUtil {
  static splitDateTime(input: string | Date): {
    voucherDate: Date;
    voucherTime: Date;
  } {
    const dateTime = new Date(input);

    if (isNaN(dateTime.getTime())) {
      throw new VoucherDateTimeError("Formato de fecha/hora inválido");
    }

    // Extract the local calendar date (Mexico City) so all vouchers on the same
    // local day share the same voucherDate value. Stored as local midnight in UTC
    // so that formatIsoDate (UTC→local) returns the correct date without shifting
    // to the previous day.
    const voucherDate = DateTime.fromJSDate(dateTime, { zone: "utc" })
      .setZone(CONFIG.TIMEZONE)
      .startOf("day")
      .toUTC()
      .toJSDate();

    // voucherTime stores the raw UTC hours. Display helpers (formatTime12Hour)
    // apply UTC→local conversion when rendering.
    const voucherTime = new Date(
      Date.UTC(
        1970,
        0,
        1,
        dateTime.getUTCHours(),
        dateTime.getUTCMinutes(),
        dateTime.getUTCSeconds(),
        dateTime.getUTCMilliseconds(),
      ),
    );

    return { voucherDate, voucherTime };
  }

  static combineDateTime(voucherDate: Date, voucherTime: Date): Date {
    // voucherDate stores local midnight in UTC → recover the local calendar date.
    const localDate = DateTime.fromJSDate(voucherDate, { zone: "utc" }).setZone(
      CONFIG.TIMEZONE,
    );
    // voucherTime stores UTC hours → convert to local clock time.
    const localTime = DateTime.fromJSDate(voucherTime, { zone: "utc" }).setZone(
      CONFIG.TIMEZONE,
    );
    // Combine local date + local clock time, then convert back to UTC.
    return localDate
      .set({
        hour: localTime.hour,
        minute: localTime.minute,
        second: localTime.second,
        millisecond: localTime.millisecond,
      })
      .toJSDate();
  }
}
