import { describe, test, beforeAll, afterAll, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import * as http from "node:http";

// Note: authorID in the notifications must coincide with the sub of the authenticated user
const testUserId = "438620bf-0884-483b-9cd2-a965caaae1f5";

vi.mock("../../src/validators/auth_validator.js", () => ({
    requireAuth: (req: Request, _res: Response, next: NextFunction) => {
        req.auth = {
            sub: testUserId,
            email: "test_user@gazella.local",
            scope: "read write"
        };
        next();
    }
}));

import { db } from "../../src/drizzle/db.js";
import { ArticleRepository } from "../../src/data_access/article_repository.js";
import { buildRedisClient } from "../../src/caching/redis_client.js";
import { RabbitMQService, NOTIFICATIONS_EXCHANGE } from "../../src/messaging/rabbitmq.js";
import { makeStreamRouter } from "../../src/routes/stream_routes.js";
import { StreamService } from "../../src/services/stream_service.js";
import { ArticleConsumer } from "../../src/messaging/article_consumer.js";

import { createTypedSseClient } from "./helpers/sse_helper.js";
import { startTestServer } from "./helpers/server_helper.js";
import { ArticleLikedNotification, ArticleCommentedNotification } from "../../src/public_schemas/article_notification.js";

describe("Article Notifications - Full E2E Flow", () => {
    let redisClient: any;
    let rabbitMQService: RabbitMQService;
    let server: http.Server;
    let baseUrl: string;

    beforeAll(async () => {
        redisClient = buildRedisClient(process.env["REDIS_URL"]);
        await redisClient.connect();

        rabbitMQService = new RabbitMQService(process.env["RABBITMQ_URL"]!, 5000);
        await rabbitMQService.connect();

        const streamService = new StreamService(redisClient);
        const repository = new ArticleRepository(db);
        const consumer = new ArticleConsumer(rabbitMQService.getChannel(), repository, streamService);
        await consumer.initialize();

        const streamRouter = makeStreamRouter(streamService);
        const testServer = await startTestServer(streamRouter);
        
        server = testServer.server;
        baseUrl = testServer.baseUrl;
    }, 60000);

    afterAll(async () => {
        if (server) {
            server.close();
        }
        
        const channel = rabbitMQService.getChannel();
        if (channel) {
            channel.on("error", () => {});
        }
        
        await rabbitMQService.close();
        
        if (redisClient?.isOpen) {
            await redisClient.quit();
        }
    });

    test("Should send an Article Liked SSE when RabbitMQ receives an article.liked event", async () => {
        const client = await createTypedSseClient<ArticleLikedNotification>(baseUrl, "MockJWT");

        const mockLikeEvent = {
            articleId: "d5b998c7-76fe-41fe-98b3-430d4c76bc77",
            authorId: testUserId,
            likeId: "a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
            likeAuthorId: "0f21a04a-a66a-44a0-8479-da93329f0728"
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "article.liked", 
            Buffer.from(JSON.stringify(mockLikeEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.articleId).toBe(mockLikeEvent.articleId);
        expect(receivedData.messageBody.likeAuthorId).toBe(mockLikeEvent.likeAuthorId);

        client.close();
    }, 15000);

    test("Should send an Article Commented SSE when RabbitMQ receives an article.commented event", async () => {
        const client = await createTypedSseClient<ArticleCommentedNotification>(baseUrl, "MockJWT");

        const mockCommentEvent = {
            articleId: "d5b998c7-76fe-41fe-98b3-430d4c76bc77",
            authorId: testUserId,
            commentId: "1aba5d19-89c4-49e3-addb-582866c90e7d",
            commentAuthorId: "0f21a04a-a66a-44a0-8479-da93329f0728",
            content: "Great article! I think..."
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "article.commented", 
            Buffer.from(JSON.stringify(mockCommentEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.commentId).toBe(mockCommentEvent.commentId);
        expect(receivedData.messageBody.content).toBe(mockCommentEvent.content);

        client.close();
    }, 15000);
});
