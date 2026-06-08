import { Request, Response, NextFunction } from "express"
import { z } from "zod"

export const validateQuery = (schema: z.ZodType) => 
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const parsedQuery = await schema.parseAsync(req.query);

            Object.defineProperty(req, "query", {
                value: parsedQuery,
                writable: true,
                enumerable: true,
                configurable: true
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: "Invalid Input",
                    details: error.issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
                return;
            }
            return next(error);
        }
    };
