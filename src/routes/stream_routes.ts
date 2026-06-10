import { Router } from "express"
import { asyncHandler } from "../handlers/async_handler.js"
import { requireAuth } from "../validators/auth_validator.js"
import { validateQuery } from "../validators/request_validator.js"
import { StreamService } from "../services/stream_service.js";
import { makeGetTicketController, makeStreamController } from "../controllers/stream_controller.js";
import { ticketSchema } from "../schemas/stream_schema.js"

export function makeStreamRouter(streamService: StreamService) {
    const router = Router();

    const getTicket = makeGetTicketController(streamService);
    const stream = makeStreamController(streamService);

    /**
     * @openapi
     * /tickets:
     *   post:
     *     tags:
     *       - Stream
     *     summary: Request an SSE connection ticket
     *     description: Requests a short-lived ticket (15s TTL) required to establish a Server-Sent Events (SSE) connection.
     *     security:
     *     - bearerAuth: []
     *     responses:
     *       200:
     *         description: Ticket successfully generated.
     *         content:
     *           application/json:
     *             schema:
     *             type: object
     *             properties:
     *               ticket:
     *                 type: string
     *                 description: A 15-second TTL ticket for SSE connection auth.
     *             example:
     *               ticket: "MY21AcEaARYuC7mUk0_l34NHFB35ooeIzehflhqDz_w"
     *       401:
     *         description: Unauthorized - JWT is missing, invalid, or expired.
     *         content:
     *           application/json:
     *             schema:
     *             type: object
     *             properties:
     *               error:
     *                 type: string
     *               message:
     *                 type: string
     *               code:
     *                 type: string
     *             example:
     *               error: "Access denied"
     *               message: "jwt expired"
     *               code: "UNAUTHORIZED"
     *       503:
     *         description: Service Unavailable - Downstream failure.
     *         content:
     *           application/json:
     *             schema:
     *             type: object
     *             properties:
     *               error:
     *                 type: string
     *               message:
     *                 type: string
     *             example:
     *               error: "Service unavailable"
     *               message: "A downstream service or database is currently unavailable. Please try again later"
     */
    router.post("/tickets", requireAuth, asyncHandler(getTicket));

    /**
     * @openapi
     * /stream:
     *   get:
     *     summary: Establish an SSE connection
     *     description: Starts a Server-Sent Events (SSE) session using a valid, short-lived authentication ticket.
     *     tags:
     *       - Stream
     *     parameters:
     *       - in: query
     *         name: ticket
     *         required: true
     *         description: A valid ticket string to authenticate the SSE connection.
     *         schema:
     *           type: string
     *           minLength: 32
     *           maxLength: 64
     *     responses:
     *       200:
     *         description: SSE connection successfully established.
     *         headers:
     *           Content-Type:
     *             description: The MIME type of the SSE stream.
     *             schema:
     *               type: string
     *               example: text/event-stream
     *           Cache-Control:
     *             description: Directives indicating that the stream should not be cached.
     *             schema:
     *               type: string
     *               example: no-cache
     *           Connection:
     *             description: Connection management directive to keep the stream open.
     *             schema:
     *               type: string
     *               example: keep-alive
     *           Transfer-Encoding:
     *             description: Specifies the form of encoding used to safely transfer the payload.
     *             schema:
     *               type: string
     *               example: chunked
     *         content:
     *           text/event-stream:
     *             schema:
     *               type: string
     *               description: A continuous stream of server-sent events.
     *       400:
     *         description: Bad Request - Invalid query parameters (e.g., ticket fails schema validation).
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
     *                 - field: "ticket"
     *                   message: "Too small: expected string to have >=32 characters"
     *       401:
     *         description: Unauthorized - The provided ticket is invalid or expired.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 code:
     *                   type: string
     *             example:
     *               message: "Invalid or expired ticket"
     *               code: "INVALID_TICKET"
     *       500:
     *         description: Internal Server Error - Failed to establish the stream.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *             example:
     *               message: "Failed to establish SSE stream"
     */
    router.get("/stream", validateQuery(ticketSchema), asyncHandler(stream));

    return router;
}
