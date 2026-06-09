import { Router } from "express"
import { asyncHandler } from "../handlers/async_handler.js"
import { requireAuth } from "../validators/auth_validator.js"
import { validateParams } from "../validators/request_validator.js"
import { markAsReadSchema } from "../schemas/inbox_schema.js"
import { InboxService } from "../services/inbox_service.js"
import { makeGetUnreadNotificationsController, makeMarkNotificationAsReadController } from "../controllers/inbox_controller.js"

export function makeInboxRouter(inboxService: InboxService) {
    const router = Router();

    const getUnreadNotifications = makeGetUnreadNotificationsController(inboxService);
    const markAsRead = makeMarkNotificationAsReadController(inboxService);
    
    router.get("/inbox", requireAuth, asyncHandler(getUnreadNotifications));

    router.patch("/inbox/:notificationType/messages/:notificationId", requireAuth, validateParams(markAsReadSchema), asyncHandler(markAsRead));

    return router;
}
