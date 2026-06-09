import { describe, test, expect, beforeEach, suite, vi, Mocked } from "vitest";
import { Request, Response } from "express";
import { makeGetUnreadNotificationsController, makeMarkNotificationAsReadController } from "../../src/controllers/inbox_controller.js";
import { InboxService } from "../../src/services/inbox_service.js";
import { NotFoundError } from "../../src/services/service_error.js";
import { MarkAsReadInput } from "../../src/schemas/inbox_schema.js";

const mockInboxService = {
    getAllUnreadNotifications: vi.fn(),
    markSocialNotificationAsRead: vi.fn(),
    markArticleNotificationAsRead: vi.fn(),
    markProjectNotificationAsRead: vi.fn()
} as unknown as Mocked<InboxService>;

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.sendStatus = vi.fn().mockReturnValue(res);
    return res as Response;
};

const mockRequest = () => {
    return {
        auth: {},
        params: {}
    } as Partial<Request>;
};

suite("Inbox Controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Get Unread Notifications Controller", () => {
        const getController = makeGetUnreadNotificationsController(mockInboxService);

        test("Should return 401 if auth.sub is missing", async () => {
            const req = mockRequest() as Request;
            const res = mockResponse();

            await getController(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid Token or subject is missing (sub)", 
                code: "MISSING_SUB" 
            });
            
            expect(mockInboxService.getAllUnreadNotifications).not.toHaveBeenCalled(); 
        });

        test("Should return 200 and the notifications if auth.sub is present", async () => {
            const req = mockRequest();
            req.auth = { sub: "user-123", email: "test@test.com", scope: "user" };
            const res = mockResponse();

            const fakeNotifications = [
                {
                    id: "1",
                    type: "socials" as const,
                    addresseeId: "user-123",
                    messageBody: {},
                    markedAsRead: false,
                    receivedAt: new Date(),
                }
            ];
            
            mockInboxService.getAllUnreadNotifications.mockResolvedValue(fakeNotifications);

            await getController(req as Request, res);

            expect(mockInboxService.getAllUnreadNotifications).toHaveBeenCalledWith("user-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(fakeNotifications);
        });
    });

    describe("Mark Notification As Read Controller", () => {
        const markController = makeMarkNotificationAsReadController(mockInboxService);

        test("Should call markSocialNotificationAsRead and return 200 for social type", async () => {
            const req = mockRequest() as Request<MarkAsReadInput>;
            req.params = { notificationType: "socials", notificationId: "notif-1" };
            const res = mockResponse();

            await markController(req, res);

            expect(mockInboxService.markSocialNotificationAsRead).toHaveBeenCalledWith("notif-1");
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        test("Should call markArticleNotificationAsRead and return 200 for article type", async () => {
            const req = mockRequest() as Request<MarkAsReadInput>;
            req.params = { notificationType: "articles", notificationId: "notif-2" };
            const res = mockResponse();

            await markController(req, res);

            expect(mockInboxService.markArticleNotificationAsRead).toHaveBeenCalledWith("notif-2");
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        test("Should call markProjectNotificationAsRead and return 200 for project type", async () => {
            const req = mockRequest() as Request<MarkAsReadInput>;
            req.params = { notificationType: "projects", notificationId: "notif-3" };
            const res = mockResponse();

            await markController(req, res);

            expect(mockInboxService.markProjectNotificationAsRead).toHaveBeenCalledWith("notif-3");
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        test("Should propagate service errors for the global error handler to catch", async () => {
            const req = mockRequest() as Request<MarkAsReadInput>;
            req.params = { notificationType: "socials", notificationId: "missing-id" };
            const res = mockResponse();

            const errorToThrow = new NotFoundError("Not found");
            
            mockInboxService.markSocialNotificationAsRead.mockRejectedValue(errorToThrow);

            // Express *should* this thrown exception to the error handling middleware.
            await expect(markController(req, res)).rejects.toThrow(NotFoundError);
            
            expect(res.sendStatus).not.toHaveBeenCalled();
        });
    });
});
