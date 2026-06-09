import { describe, test, beforeAll, afterAll, expect, vi } from "vitest";
import { RedisContainer } from "@testcontainers/redis";
import express, { Request, Response, NextFunction } from "express"
import * as http from "node:http";

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
import { SocialRepository } from "../../src/data_access/social_repository.js";
import { buildRedisClient } from "../../src/caching/redis_client.js";
import { RabbitMQService, NOTIFICATIONS_EXCHANGE } from "../../src/messaging/rabbitmq.js";
import { makeStreamRouter } from "../../src/routes/stream_routes.js";
import { StreamService } from "../../src/services/stream_service.js";
import { SocialConsumer } from "../../src/messaging/social_consumer.js";

import { createTypedSseClient } from "./sse_helper.js";
import { NewFollowerNotification } from "../../src/public_schemas/social_notification.js";

describe("Notification Service - Full E2E Flow", () => {
    let redisContainer: any;
    let redisClient: any;
    let rabbitMQService: RabbitMQService;
    let server: http.Server;
    let baseUrl: string;

    let testNewFollowerId = "d5b998c7-76fe-41fe-98b3-430d4c76bc77";

    beforeAll(async () => {
        redisContainer = await new RedisContainer("redis:7.2-alpine").start();
        process.env["REDIS_URL"] = redisContainer.getConnectionUrl(); 

        redisClient = buildRedisClient(process.env["REDIS_URL"]);
        await redisClient.connect();

        rabbitMQService = new RabbitMQService(process.env["RABBITMQ_URL"]!, 5000);
        await rabbitMQService.connect();

        const streamService = new StreamService(redisClient);
        const repository = new SocialRepository(db);
        const consumer = new SocialConsumer(rabbitMQService.getChannel(), repository, streamService);
        await consumer.initialize();

        const app = express();
        app.use(express.json());
        app.use(makeStreamRouter(streamService));

        await new Promise<void>((resolve) => {
            server = app.listen(0, () => {
                baseUrl = `http://localhost:${(server.address() as any).port}`;
                resolve();
            });
        });
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
        await redisContainer?.stop();
    });

    test("Should send a typed SSE to the client after RabbitMQ receives an event", async () => {
        const client = await createTypedSseClient<NewFollowerNotification>(baseUrl, "MockJWT");

        const mockEvent = {
            newFollowerId: testNewFollowerId,
            followedId: testUserId,
            timestamp: new Date().toISOString()
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "new.follower",
            Buffer.from(JSON.stringify(mockEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.newFollowerId).toBe(testNewFollowerId);

        client.close();
    }, 15000);
});
