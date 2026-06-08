import { Request, Response } from 'express';
import { StreamService } from '../services/stream_service.js';
import { TicketInput } from "../schemas/stream_schema.js"

export const makeGetTicketController = (service: StreamService) => {
    return async (req: Request, res:Response) : Promise<void> => {
        const userId = req.auth?.sub;

        if (!userId) {
            res.status(401).json({ message: "Invalid Token or subject is missing (sub)", code: "MISSING_SUB" });
            return;
        }

        const ticket = service.getBase64Ticket();

        await service.setTicket(ticket, userId);

        res.status(200).json({ticket: ticket});
    }
}

export const makeStreamController = (service: StreamService) => {
    return async (req: Request<{}, {}, {}, TicketInput>, res: Response) : Promise<void> => {
        const ticket = req.query.ticket;

        try {
            const userId = await service.consumeTicket(ticket);

            if (!userId) {
                res.status(401).json({message: "Invalid or expired ticket", code: "INVALID_TICKET"});
                return;
            }

            res.writeHead(200, {
                "content-type": "text/event-stream",
                "cache-control": "no-cache",
                "connection": "keep-alive"
            });

            res.write("retry: 10000\n\n");

            service.addConnection(userId, res);

            req.on("close", () => {
                service.removeConnection(userId, res);
            });
        } catch (error) {
            console.error("Error establishing SSE stream: ", error);
            if (res.headersSent) {
                res.end();
            } else {
                res.status(500).json({ message: "Failed to establish SSE stream" });
            }
        }
    }
}
