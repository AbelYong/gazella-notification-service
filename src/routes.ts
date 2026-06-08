import { Router } from "express"
import { asyncHandler } from "./handlers/async_handler.js"
import { requireAuth } from "./validators/auth_validator.js"
import { validateQuery } from "./validators/request_validator.js"
import { redisClient } from "./caching/redis_client.js"
import { StreamService } from "./services/stream_service.js";
import { makeGetTicketController } from "./controllers/stream_controller.js";

const router = Router();

const streamService = new StreamService(redisClient);

const getTicket = makeGetTicketController(streamService);

router.post("/ticket", requireAuth, asyncHandler(getTicket));

router.get("/stream", requireAuth);

export const NotificationsRouter = router;
