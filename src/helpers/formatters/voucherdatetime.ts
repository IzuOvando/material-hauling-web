import { VoucherDateTimeError } from "@/errors";

export class VoucherDateTimeUtil {

    static splitDateTime(input: string | Date): { voucherDate: Date; voucherTime: Date } {
        const dateTime = new Date(input);

        if (isNaN(dateTime.getTime())) {
            throw new VoucherDateTimeError("Formato de fecha/hora inválido");
        }

        const voucherDate = new Date(dateTime);
        voucherDate.setHours(0, 0, 0, 0);
    
        const voucherTime = new Date(dateTime);
        voucherTime.setFullYear(1970, 0, 1);
        return { voucherDate, voucherTime };
    }
  
    static combineDateTime(voucherDate: Date, voucherTime: Date): Date {
        const combinedDate = new Date(voucherDate);
        combinedDate.setHours(voucherTime.getHours(), voucherTime.getMinutes(), voucherTime.getSeconds());
        return combinedDate;
    }
  }

  