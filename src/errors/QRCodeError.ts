export default class QRCodeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'QRCodeError';
    }
}