export default class ValidationError extends Error {
    constructor(field: string, message: string) {
        super(`Validation Error on field "${field}": ${message}`);
        this.name = 'ValidationError';
    }
}