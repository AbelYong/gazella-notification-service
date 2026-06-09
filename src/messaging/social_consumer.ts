import amqp, { ConsumeMessage } from "amqplib"
import { NewFollowerMsg } from "./messages.js"
import { NewFollowerInput, NewFollowerSchema } from "../schemas/social_schema.js"
import { DbError } from "../data_access/db_error.js"
import { SocialRepository } from "../data_access/social_repository.js"
import { NOTIFICATIONS_EXCHANGE, NOTIFICATIONS_QUEUE, DLQ_EXCHANGE, MAX_RETRIES, getRetryCount } from "./rabbitmq.js"
import { StreamService } from "../services/stream_service.js"

const newFollowerRoutingKey = "new.follower";

export class SocialConsumer {
    constructor(
        private readonly channel: amqp.Channel,
        private readonly repository: SocialRepository,
        private readonly stream: StreamService
    ) {}

    async initialize() {
        try {
            await this.channel.bindQueue(NOTIFICATIONS_QUEUE, NOTIFICATIONS_EXCHANGE, newFollowerRoutingKey)

            this.channel.prefetch(1);

            this.channel.consume(NOTIFICATIONS_QUEUE, (msg) => {
                if (!msg) {
                    return;   
                }
                this.processNewFollowerEvent(msg);
            },
            { noAck: false }
            );

        } catch (error) {
            console.error(`Failed to initialize consumer for ${newFollowerRoutingKey} event:`, error);
        }
    }

    async processNewFollowerEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] A new follower event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as NewFollowerMsg;
            const isValid = NewFollowerSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: NewFollowerInput = isValid.data;

                const newNotification = await this.repository.storeNewFollowerNotification(validMsg);
                console.log("[EVENT] A new follower message has been saved.");

                this.stream.broadcastToUser(validMsg.followedId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed new follower message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            console.error(`Failed to process event ${newFollowerRoutingKey}:`, error);

            if (!(error instanceof DbError)) {
                console.error("An unexpected error has occurred while processing a new follower event: ", error);
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
}
