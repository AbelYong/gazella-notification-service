
export class ServiceError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string, public readonly statusCode: number = 404) {
        super(message, statusCode);
    }
}
