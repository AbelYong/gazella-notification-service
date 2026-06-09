import amqp, { ConsumeMessage } from "amqplib"
import { NOTIFICATIONS_EXCHANGE, NOTIFICATIONS_QUEUE, DLQ_EXCHANGE, MAX_RETRIES, getRetryCount } from "./rabbitmq.js"
import { ArticleLikedMsg, ArticleCommentedMsg } from "./messages.js"
import { ArticleLikedInput, ArticleCommentedInput, ArticleLikedSchema, ArticleCommentedSchema } from "../schemas/article_schema.js"
import { DbError } from "../data_access/db_error.js"
import { ArticleRepository } from "../data_access/article_repository.js"
import { StreamService } from "../services/stream_service.js"

const ROUTING_KEYS = {
    ARTICLE_LIKED: "article.liked",
    ARTICLE_COMMENTED: "article.commented"
}

export class ArticleConsumer {
    constructor(
        private readonly channel: amqp.Channel,
        private readonly repository: ArticleRepository,
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
                    case ROUTING_KEYS.ARTICLE_LIKED:
                        this.processArticleLikedEvent(msg);
                        break;
                    case ROUTING_KEYS.ARTICLE_COMMENTED:
                        this.processArticleCommentedEvent(msg);
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
            console.error(`Failed to initialize consumer: ${error}`);
        }
    }

    async processArticleLikedEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] An article liked event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as ArticleLikedMsg;
            const isValid = ArticleLikedSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: ArticleLikedInput = isValid.data;
                
                const newNotification = await this.repository.storeArticleLikedNotification(validMsg);
                console.log("[EVENT] An article liked message has been saved.");

                this.stream.broadcastToUser(validMsg.authorId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed article liked message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.ARTICLE_LIKED);
        }
    }

    async processArticleCommentedEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] An article commented event has been received from the MQ: ${content}`);

            const msgData = JSON.parse(content) as ArticleCommentedMsg;
            const isValid = ArticleCommentedSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: ArticleCommentedInput = isValid.data;
                
                const newNotification = await this.repository.storeArticleCommentedNotification(validMsg);
                console.log("[EVENT] An article commented message has been saved.");

                this.stream.broadcastToUser(validMsg.authorId, newNotification);
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed article commented message has been received: ${isValid.error}`);

                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.ARTICLE_COMMENTED);
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

