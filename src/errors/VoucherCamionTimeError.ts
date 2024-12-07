export default class VoucherDateTimeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "VoucherDateTimeError";
    }
}
