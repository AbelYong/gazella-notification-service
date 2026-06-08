import { Router } from "express"
import { asyncHandler } from "./handlers/async_handler.js"
import { requireAuth } from "./validators/auth_validator.js"
import { validateQuery } from "./validators/request_validator.js"
import { StreamService } from "./services/stream_service.js";
import { makeGetTicketController, makeStreamController } from "./controllers/stream_controller.js";
import { ticketSchema } from "./schemas/stream_schema.js"

export function makeStreamRouter(streamService: StreamService) {
    const router = Router();

    const getTicket = makeGetTicketController(streamService);
    const stream = makeStreamController(streamService);

    router.post("/ticket", requireAuth, asyncHandler(getTicket));

    router.get("/stream", validateQuery(ticketSchema), asyncHandler(stream));

    return router;
}
