import amqp, { ConsumeMessage } from "amqplib";
import { NOTIFICATIONS_EXCHANGE, NOTIFICATIONS_QUEUE, DLQ_EXCHANGE, MAX_RETRIES, getRetryCount } from "./rabbitmq.js";
import { NewEnrollmentMsg, EnrollmentCancelledMsg, ProjectAboutToBeginMsg, ProjectFullMsg } from "./messages.js";
import { NewEnrollmentInput, EnrollmentCancelledInput, ProjectAboutToBeginInput, ProjectFullInput, NewEnrollmentSchema, EnrollmentCancelledSchema, ProjectAboutToBeginSchema, ProjectFullSchema } from "../schemas/project_schema.js";
import { DbError } from "../data_access/db_error.js";
import { ProjectRepository } from "../data_access/project_repository.js";
import { StreamService } from "../services/stream_service.js";

const ROUTING_KEYS = {
    NEW_ENROLLMENT: "project.enrollment.new",
    ENROLLMENT_CANCELLED: "project.enrollment.cancelled",
    PROJECT_START_NEAR: "project.start.near",
    PROJECT_FULL: "project.full"
};

export class ProjectConsumer {
    constructor(
        private readonly channel: amqp.Channel,
        private readonly repository: ProjectRepository,
        private readonly stream: StreamService
    ) {}

    async initialize() {
        try {
            const routingKeys = Object.values(ROUTING_KEYS);
            for (const routingKey of routingKeys) {
                await this.channel.bindQueue(NOTIFICATIONS_QUEUE, NOTIFICATIONS_EXCHANGE, routingKey);
            }
            this.channel.prefetch(1);

            this.channel.consume(NOTIFICATIONS_QUEUE, (msg) => {
                if (!msg) {
                    return;   
                }

                const routingKey = msg.fields.routingKey;

                switch (routingKey) {
                    case ROUTING_KEYS.NEW_ENROLLMENT:
                        this.processNewEnrollmentEvent(msg);
                        break;
                    case ROUTING_KEYS.ENROLLMENT_CANCELLED:
                        this.processEnrollmentCancelledEvent(msg);
                        break;
                    case ROUTING_KEYS.PROJECT_START_NEAR:
                        this.processProjectAboutToBeginEvent(msg);
                        break;
                    case ROUTING_KEYS.PROJECT_FULL:
                        this.processProjectFullEvent(msg);
                        break;
                    default:
                        console.warn(`[EVENT] Received unknown routing key: ${routingKey}`);
                        this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                        this.channel.ack(msg);
                        break;
                }
            },
            { noAck: false }
            );
        } catch (error) {
            console.error(`Failed to initialize project consumer: ${error}`);
        }
    }

    async processNewEnrollmentEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] A new enrollment event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as NewEnrollmentMsg;
            const isValid = NewEnrollmentSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: NewEnrollmentInput = isValid.data;
                
                const newNotification = await this.repository.storeNewEnrollmentNotification(validMsg);
                console.log("[EVENT] A new enrollment message has been saved.");

                this.stream.broadcastToUser(validMsg.organizerId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed new enrollment message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.NEW_ENROLLMENT);
        }
    }

    async processEnrollmentCancelledEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] An enrollment cancelled event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as EnrollmentCancelledMsg;
            const isValid = EnrollmentCancelledSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: EnrollmentCancelledInput = isValid.data;
                
                const newNotification = await this.repository.storeEnrollmentCancelledNotification(validMsg);
                console.log("[EVENT] An enrollment cancelled message has been saved.");

                this.stream.broadcastToUser(validMsg.organizerId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed enrollment cancelled message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.ENROLLMENT_CANCELLED);
        }
    }

    async processProjectAboutToBeginEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] A project about to begin event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as ProjectAboutToBeginMsg;
            const isValid = ProjectAboutToBeginSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: ProjectAboutToBeginInput = isValid.data;
                
                const newNotification = await this.repository.storeProjectAboutToBeginNotification(validMsg);
                console.log("[EVENT] A project about to begin message has been saved.");

                // Note: Addressee for this specific event is the volunteer, not the organizer
                this.stream.broadcastToUser(validMsg.volunteerId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed project about to begin message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.PROJECT_START_NEAR);
        }
    }

    async processProjectFullEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] A project full event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as ProjectFullMsg;
            const isValid = ProjectFullSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: ProjectFullInput = isValid.data;
                
                const newNotification = await this.repository.storeProjectFullNotification(validMsg);
                console.log("[EVENT] A project full message has been saved.");

                this.stream.broadcastToUser(validMsg.organizerId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed project full message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.PROJECT_FULL);
        }
    }

    private handleProcessingError(error: any, msg: ConsumeMessage, routingKey: string) {
        console.error(`Failed to process event ${routingKey}:`, error);

        if (!(error instanceof DbError)) {
            console.error(`An unexpected error has occurred while processing ${routingKey}: `, error);
            this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            this.channel.ack(msg);
            return;
        }

        const retries = getRetryCount(msg);

        if (retries > MAX_RETRIES) {
            this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            this.channel.ack(msg);
        } else {
            console.log(`Failed to process message at attempt ${retries} of ${MAX_RETRIES}. Sending message to wait queue`);
            this.channel.nack(msg, false, false);
        }
    }
}
