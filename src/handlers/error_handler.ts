import { Request, Response, NextFunction } from "express"
import { ServiceError } from "../services/service_error.js";

export const globalErrorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (handleServiceError(err, res)) {
        return;
    }

    if (err.name === "UnauthorizedError") {
        res.status(401).json({
            error: "Access denied",
            message: err.message,
            code: "UNAUTHORIZED"
        });
        return;
    }

    const isServiceUnavailable =
        errorCodes.has(err.code) || (err.message === "The client is offline");

    if (isServiceUnavailable) {
        res.status(503).json({
            error: "Service unavailable",
            message: "A downstream service or database is currently unavailable. Please try again later"
        });
        return;
    }

    if (process.env["NODE_ENV"] !== 'test') {
        console.error("Error:", err);
    }

    res.status(500).json({
        error: "Internal Server Error",
        message: process.env["NODE_ENV"] === "production" ?
            "An unexpected error has occurred"
            :
            err.message
    });
}

function handleServiceError(err: any, res: Response): boolean {
    let isHandled = false;
    if (err instanceof ServiceError) {
        res.status(err.statusCode).json({message: err.message});
        isHandled = true;
    }
    return isHandled;
}

const errorCodes: Set<string> = new Set([
    "ECONNREFUSED",
    "EAI_AGAIN",
    "08006",
    "57P03"
]);
