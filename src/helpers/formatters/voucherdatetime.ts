import { VoucherDateTimeError } from "@/errors";

export class VoucherDateTimeUtil {

    static splitDateTime(input: string | Date): { voucherDate: Date; voucherTime: Date } {
        const dateTime = new Date(input);

        if (isNaN(dateTime.getTime())) {
            throw new VoucherDateTimeError("Formato de fecha/hora inválido");
        }

        const voucherDate = new Date(Date.UTC(
            dateTime.getUTCFullYear(),
            dateTime.getUTCMonth(),
            dateTime.getUTCDate(),
            0, 0, 0, 0
        ));

        const voucherTime = new Date(Date.UTC(
            1970, 0, 1,
            dateTime.getUTCHours(),
            dateTime.getUTCMinutes(),
            dateTime.getUTCSeconds(),
            dateTime.getUTCMilliseconds()
        ));

        return { voucherDate, voucherTime };
    }

    static combineDateTime(voucherDate: Date, voucherTime: Date): Date {
        return new Date(Date.UTC(
            voucherDate.getUTCFullYear(),
            voucherDate.getUTCMonth(),
            voucherDate.getUTCDate(),
            voucherTime.getUTCHours(),
            voucherTime.getUTCMinutes(),
            voucherTime.getUTCSeconds(),
            voucherTime.getUTCMilliseconds()
        ));
    }
  }
