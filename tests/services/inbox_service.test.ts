import { describe, test, expect, beforeEach, vi, suite } from "vitest";
import { InboxService } from "../../src/services/inbox_service.js";
import { NotFoundError } from "../../src/services/service_error.js";

const mockSocialRepo = {
    getUnreadNotifications: vi.fn(),
    markNotificationAsRead: vi.fn()
};

const mockArticleRepo = {
    getUnreadNotifications: vi.fn(),
    markNotificationAsRead: vi.fn()
};

const mockProjectRepo = {
    getUnreadNotifications: vi.fn(),
    markNotificationAsRead: vi.fn()
};

suite("Inbox Service Unit Tests", () => {
    let inboxService: InboxService;

    beforeEach(() => {
        vi.clearAllMocks();

        // We cast to 'any' here since the mocks don't implement the full class signature, just what we need.
        inboxService = new InboxService(
            mockSocialRepo as any,
            mockArticleRepo as any,
            mockProjectRepo as any
        );
    });

    describe("getAllUnreadNotifications", () => {
        test("Should retrieve and aggregate notifications from all three repositories", async () => {
            const testUserId = "95a62132-8602-4df2-87fe-cba5432f442d";

            const mockSocialData = [{ id: "s1", type: "social" }];
            const mockArticleData = [{ id: "a1", type: "article" }, { id: "a2", type: "article" }];
            const mockProjectData = [{ id: "p1", type: "project" }];

            mockSocialRepo.getUnreadNotifications.mockResolvedValue(mockSocialData);
            mockArticleRepo.getUnreadNotifications.mockResolvedValue(mockArticleData);
            mockProjectRepo.getUnreadNotifications.mockResolvedValue(mockProjectData);

            const result = await inboxService.getAllUnreadNotifications(testUserId);

            expect(mockSocialRepo.getUnreadNotifications).toHaveBeenCalledWith(testUserId);
            expect(mockArticleRepo.getUnreadNotifications).toHaveBeenCalledWith(testUserId);
            expect(mockProjectRepo.getUnreadNotifications).toHaveBeenCalledWith(testUserId);

            expect(result).toHaveLength(4);
            expect(result).toEqual([...mockSocialData, ...mockArticleData, ...mockProjectData]);
        });

        test("Should successfully return data even if some repositories return empty arrays", async () => {
            const testUserId = "95a62132-8602-4df2-87fe-cba5432f442d";

            mockSocialRepo.getUnreadNotifications.mockResolvedValue([]);
            mockArticleRepo.getUnreadNotifications.mockResolvedValue([{ id: "a1", type: "article" }]);
            mockProjectRepo.getUnreadNotifications.mockResolvedValue([]);

            const result = await inboxService.getAllUnreadNotifications(testUserId);

            expect(result).toHaveLength(1);
        });
    });

    describe("markSocialNotificationAsRead", () => {
        test("Should resolve successfully if the repository successfully updates the notification", async () => {
            const notifId = "11111111-1111-1111-1111-111111111111";
            
            mockSocialRepo.markNotificationAsRead.mockResolvedValue({ id: notifId, markedAsRead: true });

            await expect(inboxService.markSocialNotificationAsRead(notifId)).resolves.not.toThrow();
            expect(mockSocialRepo.markNotificationAsRead).toHaveBeenCalledWith(notifId);
        });

        test("Should throw NotFoundError if the repository returns undefined", async () => {
            const notifId = "missing-123";
            
            mockSocialRepo.markNotificationAsRead.mockResolvedValue(undefined);

            await expect(inboxService.markSocialNotificationAsRead(notifId)).rejects.toThrow(NotFoundError);
        });
    });

    describe("markArticleNotificationAsRead", () => {
        test("Should resolve successfully if the repository successfully updates the notification", async () => {
            const notifId = "22222222-2222-2222-2222-222222222222";
            
            mockArticleRepo.markNotificationAsRead.mockResolvedValue({ id: notifId, markedAsRead: true });

            await expect(inboxService.markArticleNotificationAsRead(notifId)).resolves.not.toThrow();
            expect(mockArticleRepo.markNotificationAsRead).toHaveBeenCalledWith(notifId);
        });

        test("Should throw NotFoundError if the repository returns undefined", async () => {
            const notifId = "missing-123";
            
            mockArticleRepo.markNotificationAsRead.mockResolvedValue(undefined);

            await expect(inboxService.markArticleNotificationAsRead(notifId)).rejects.toThrow(NotFoundError);
        });
    });

    describe("markProjectNotificationAsRead", () => {
        test("Should resolve successfully if the repository successfully updates the notification", async () => {
            const notifId = "33333333-3333-3333-3333-333333333333";
            
            mockProjectRepo.markNotificationAsRead.mockResolvedValue({ id: notifId, markedAsRead: true });

            await expect(inboxService.markProjectNotificationAsRead(notifId)).resolves.not.toThrow();
            expect(mockProjectRepo.markNotificationAsRead).toHaveBeenCalledWith(notifId);
        });

        test("Should throw NotFoundError if the repository returns undefined", async () => {
            const notifId = "missing-123";
            
            mockProjectRepo.markNotificationAsRead.mockResolvedValue(undefined);

            await expect(inboxService.markProjectNotificationAsRead(notifId)).rejects.toThrow(NotFoundError);
        });
    });
});
