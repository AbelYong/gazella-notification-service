import { describe, test, beforeAll, afterAll, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import * as http from "node:http";

// Note: this id will function as organizerId or volunteerId depending on the test context
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
import { ProjectRepository } from "../../src/data_access/project_repository.js";
import { buildRedisClient } from "../../src/caching/redis_client.js";
import { RabbitMQService, NOTIFICATIONS_EXCHANGE } from "../../src/messaging/rabbitmq.js";
import { makeStreamRouter } from "../../src/routes/stream_routes.js";
import { StreamService } from "../../src/services/stream_service.js";
import { ProjectConsumer } from "../../src/messaging/project_consumer.js";

import { createTypedSseClient } from "./helpers/sse_helper.js";
import { startTestServer } from "./helpers/server_helper.js";
import { NewEnrollmentNotification, EnrollmentCancelledNotification, ProjectAboutToBeginNotification, ProjectFullNotification } from "../../src/public_schemas/project_notification.js";

describe("Project Notifications - Full E2E Flow", () => {
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
        const repository = new ProjectRepository(db);
        const consumer = new ProjectConsumer(rabbitMQService.getChannel(), repository, streamService);
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

    test("Should send a New Enrollment SSE to the organizer", async () => {
        const client = await createTypedSseClient<NewEnrollmentNotification>(baseUrl, "MockJWT");

        const mockEvent = {
            projectId: "a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
            organizerId: testUserId,
            projectTitle: "Campaña de Reforestación",
            volunteerId: "0f21a04a-a66a-44a0-8479-da93329f0728",
            volunteerName: "John Doe"
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "project.enrollment.new", 
            Buffer.from(JSON.stringify(mockEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.eventKey).toBe("NEW_ENROLLMENT");
        expect(receivedData.messageBody.volunteerName).toBe(mockEvent.volunteerName);

        client.close();
    }, 15000);

    test("Should send an Enrollment Cancelled SSE to the organizer", async () => {
        const client = await createTypedSseClient<EnrollmentCancelledNotification>(baseUrl, "MockJWT");

        const mockEvent = {
            projectId: "a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
            organizerId: testUserId,
            projectTitle: "Campaña de Reforestación",
            volunteerId: "0f21a04a-a66a-44a0-8479-da93329f0728",
            volunteerName: "John Doe"
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "project.enrollment.cancelled", 
            Buffer.from(JSON.stringify(mockEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.eventKey).toBe("ENROLLMENT_CANCELLED");
        expect(receivedData.messageBody.volunteerName).toBe(mockEvent.volunteerName);

        client.close();
    }, 15000);

    test("Should send a Project About To Begin SSE to the volunteer", async () => {
        const client = await createTypedSseClient<ProjectAboutToBeginNotification>(baseUrl, "MockJWT");

        const testDate = new Date();
        testDate.setDate(testDate.getDate() + 1);

        const mockEvent = {
            projectId: "a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
            organizerId: "0f21a04a-a66a-44a0-8479-da93329f0728", 
            projectTitle: "Campaña de Reforestación",
            startDate: testDate.toISOString(), 
            volunteerId: testUserId
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "project.start.near", 
            Buffer.from(JSON.stringify(mockEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.eventKey).toBe("PROJECT_START_NEAR");
        expect(receivedData.messageBody.startDate).toBe(mockEvent.startDate);

        client.close();
    }, 15000);

    test("Should send a Project Full SSE to the organizer", async () => {
        const client = await createTypedSseClient<ProjectFullNotification>(baseUrl, "MockJWT");

        const mockEvent = {
            projectId: "a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
            organizerId: testUserId,
            projectTitle: "Campaña de Reforestación"
        };

        rabbitMQService.getChannel().publish(
            NOTIFICATIONS_EXCHANGE,
            "project.full", 
            Buffer.from(JSON.stringify(mockEvent))
        );

        const receivedData = await client.nextMessage;

        expect(receivedData).toBeDefined();
        expect(receivedData.addresseeId).toBe(testUserId);
        expect(receivedData.messageBody.eventKey).toBe("PROJECT_FULL");
        expect(receivedData.messageBody.projectTitle).toBe(mockEvent.projectTitle);

        client.close();
    }, 15000);
});
