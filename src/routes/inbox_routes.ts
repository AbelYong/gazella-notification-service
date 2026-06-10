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
    
    /**
     * @openapi
     * /inbox:
     *   get:
     *     summary: Retrieve unread notifications
     *     description: Fetches a list of unread notifications for the authenticated user. Note that the `messageBody` structure varies significantly based on the `eventKey`. Please refer to the README for all specific message body schemas.
     *     tags:
     *       - Inbox
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: A list of unread notifications successfully retrieved.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                     format: uuid
     *                     description: Unique identifier for the notification.
     *                   type:
     *                     type: string
     *                     enum: [socials, articles, projects]
     *                     description: The category of the notification.
     *                   addresseeId:
     *                     type: string
     *                     format: uuid
     *                     description: The user ID of the notification recipient.
     *                   messageBody:
     *                     type: object
     *                     description: Payload of the notification. Schema depends entirely on the `eventKey`. Refer to README.
     *                     properties:
     *                       eventKey:
     *                         type: string
     *                         description: Identifier that determines the rest of the payload structure.
     *                     additionalProperties: true
     *                   markedAsRead:
     *                     type: boolean
     *                     description: Indicates if the notification has been read.
     *                   receivedAt:
     *                     type: string
     *                     format: date-time
     *                     description: Timestamp of when the notification was received.
     *                 example:
     *                   id: "b4007b01-f282-4d93-bf69-741b06f163cc"
     *                   type: "projects"
     *                   addresseeId: "438620bf-0884-483b-9cd2-a965caaae1f5"
     *                   messageBody:
     *                     eventKey: "PROJECT_FULL"
     *                     projectId: "a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5"
     *                     organizerId: "438620bf-0884-483b-9cd2-a965caaae1f5"
     *                     projectTitle: "Reforestation campaign"
     *                   markedAsRead: false
     *                   receivedAt: "2026-06-10T03:16:45.367Z"
     *       401:
     *         description: Unauthorized - JWT is missing, invalid, or expired.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                 message:
     *                   type: string
     *                 code:
     *                   type: string
     *             example:
     *               error: "Access denied"
     *               message: "jwt expired"
     *               code: "UNAUTHORIZED"
     *       503:
     *         description: Service Unavailable - Downstream failure.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                 message:
     *                   type: string
     *             example:
     *               error: "Service unavailable"
     *               message: "A downstream service or database is currently unavailable. Please try again later"
     */
    router.get("/inbox", requireAuth, asyncHandler(getUnreadNotifications));

    /**
     * @openapi
     * /inbox/{notificationType}/messages/{notificationId}:
     *   patch:
     *     summary: Mark a notification as read
     *     description: Updates a specific notification by marking it as read. Requires authentication and valid path parameters.
     *     tags:
     *       - Inbox
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: notificationType
     *         required: true
     *         description: The category of the notification.
     *         schema:
     *           type: string
     *           enum: [socials, articles, projects]
     *       - in: path
     *         name: notificationId
     *         required: true
     *         description: The unique identifier of the notification.
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Notification successfully marked as read. No content is returned.
     *       400:
     *         description: Bad Request - Path parameters failed schema validation.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                 details:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       field:
     *                         type: string
     *                       message:
     *                         type: string
     *             example:
     *               error: "Invalid Input"
     *               details:
     *                 - field: "notificationType"
     *                   message: "Invalid option: expected one of \"socials\"|\"articles\"|\"projects\""
     *       401:
     *         description: Unauthorized - JWT is missing, invalid, or expired.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                 message:
     *                   type: string
     *                 code:
     *                   type: string
     *             example:
     *               error: "Access denied"
     *               message: "jwt expired"
     *               code: "UNAUTHORIZED"
     *       404:
     *         description: Not Found - The notification does not exist or was already marked as read.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *             example:
     *               message: "An article notification with Id: 3f8b89e3-2c1a-4b98-9e5d-1c8a6b2d4e7f could not be found. It might have been marked as read already"
     *       503:
     *         description: Service Unavailable - Downstream failure.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                 message:
     *                   type: string
     *             example:
     *               error: "Service unavailable"
     *               message: "A downstream service or database is currently unavailable. Please try again later"
     */
    router.patch("/inbox/:notificationType/messages/:notificationId", requireAuth, validateParams(markAsReadSchema), asyncHandler(markAsRead));

    return router;
}
