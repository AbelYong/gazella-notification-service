import { Request, Response, NextFunction } from "express"

export const globalErrorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (process.env["NODE_ENV"] !== 'test') {
        console.error("Error:", err);
    }

    if (err.name === "UnauthorizedError") {
        res.status(401).json({
            error: "Access deniend",
            message: err.message,
            code: "UNAUTHORIZED"
        });
        return;
    }

    if (errorCodes.has(err.code)) {
        res.status(503).json({
            error: "Service unavaible",
            message: "A downstream service or database is currently unavaible. Please try again later"
        });
        return;
    }

    res.status(500).json({
        error: "Internal Server Error",
        message: process.env["NODE_ENV"] === "production" ?
            "An unexpected error has occurred"
            :
            err.message
    });
}

const errorCodes: Set<string> = new Set([
    "ECONNREFUSED",
    "08006",
    "57P03"
]);
