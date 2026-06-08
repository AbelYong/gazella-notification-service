import { Request, Response } from 'express';
import { StreamService } from '../services/stream_service.js';

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
