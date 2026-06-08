import amqp, { ConsumeMessage } from "amqplib";

// We need to import the exact types or TypesSript confuses amqpblib Connection and Channel types
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>;

export const NOTIFICATIONS_EXCHANGE: string = "notifications_events";
export const WAIT_EXCHANGE: string = "notifications_wait_exchange";
export const DLQ_EXCHANGE: string = "notifications_dlq_exchange";

export const NOTIFICATIONS_QUEUE: string = "notifications_service_queue";
export const WAIT_QUEUE: string = "notifications_service_wait_queue";
export const DLQ_QUEUE: string = "notifications_service_dlq";

export const MAX_RETRIES: number = 3;

export class RabbitMQService {
    private connection: AmqpConnection | null = null;
    private channel: AmqpChannel | null = null;

    constructor(private readonly url: string, private readonly reconnectTimeout: number) {
        this.url = url;
        this.reconnectTimeout = reconnectTimeout;
    }

    public async connect(): Promise<void> {
        if (this.connection) {
            return;
        }

        try {
            console.log("[RabbitMQ] Connecting to RabbitMQ");
            
            const conn = await amqp.connect(this.url);
            this.connection = conn;
            
            conn.on("error", (err: Error) => {
                console.error("[RabbitMQ] Failed to connect to RabbitMQ: ", err.message);
            });

            conn.on("close", () => {
                console.warn('[RabbitMQ] Connection to RabbitMQ has been closed. Attempting reconnect...');
                this.connection = null;
                this.channel = null;
                this.scheduleReconnect();
            });

            console.log("[RabbitMQ] Connection to RabbitMQ succesfully established");
            await this.createChannel();
        } catch (error) {
            console.error("[RabbitMQ] Failed to connect to RabbitMQ, retrying...", (error as Error).message);
            this.scheduleReconnect();
        }
    }

    /**
     * Creates a communication channel. If the channel closes unexpectedly, 
     * closes the connection to force a complete reconnection cycle.
     */
    private async createChannel(): Promise<void> {
        const conn = this.connection;
        if (!conn) {
            return;
        }

        try {
            const ch = await conn.createChannel();
            this.channel = ch;

            await this.setupTopology(ch);
            
            ch.on("error", (err: Error) => {
                console.error("[RabbitMQ] Error on the RabbitMQ channel:", err.message);
            });

            ch.on("close", () => {
                console.warn("[RabbitMQ] The RabbitMQ channel has been closed");
                if (this.connection) {
                    this.connection.close(); 
                }
            });

            console.log("[RabbitMQ] RabbitMQ Channel succesfully created");
        } catch (error) {
            console.error("[RabbitMQ] Failed to create the RabbitMQ Channel", (error as Error).message);
            if (this.connection) {
                this.connection.close();
            }
        }
    }

    private async setupTopology(channel: amqp.Channel) : Promise<void> {
        await channel.assertExchange(NOTIFICATIONS_EXCHANGE, "topic", { durable: true });
        await channel.assertExchange(WAIT_EXCHANGE, "topic", { durable: true });
        await channel.assertExchange(DLQ_EXCHANGE, "topic", { durable: true });

        await channel.assertQueue(DLQ_QUEUE, { durable: true });
        await channel.bindQueue(DLQ_QUEUE, DLQ_EXCHANGE, "dlq.routing.key");

        await channel.assertQueue(WAIT_QUEUE, { 
            durable: true,
            arguments: {
                "x-message-ttl": 5000,
                "x-dead-letter-exchange": NOTIFICATIONS_EXCHANGE
            }
        });
        await channel.bindQueue(WAIT_QUEUE, WAIT_EXCHANGE, "wait.routing.key");

        await channel.assertQueue(NOTIFICATIONS_QUEUE, { 
            durable: true,
            arguments: {
                "x-dead-letter-exchange": WAIT_EXCHANGE,
                "x-dead-letter-routing-key": "wait.routing.key"
            }
        });

        console.log("[RabbitMQ] Toplogy configured (Account -> Wait -> Account | DLQ)");
    }

    private scheduleReconnect(): void {
        setTimeout(() => {
            this.connect();
        }, this.reconnectTimeout);
    }

    /**
     * Returns the current active channel. Use to publish or listen to incoming messages.
     */
    public getChannel(): AmqpChannel {
        if (!this.channel) {
            throw new Error("The RabbitMQ channel has not been initialized, please call Connect() first.");
        }
        return this.channel;
    }

    /**
     * Gracefully closes the connection to RabbitMQ
     */
    public async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log("[RabbitMQ] Disconnected gracefully from RabbitMQ");
        } catch (error) {
            console.error("[RabbitMQ] Error on closing RabbitMQ connection", error);
        }
    }
}

export function getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers;
    if (!headers) {
        return 0;
    }
    const xDeath = headers["x-death"];

    if (!xDeath || !Array.isArray(xDeath)) {
        return 0;
    }

    const deathEntry = xDeath.find((entry: amqp.XDeath) => entry.queue === NOTIFICATIONS_QUEUE);
    return deathEntry ? deathEntry.count : 0;
}

export const rabbitMQService = new RabbitMQService(process.env["RABBITMQ_URL"] || "amqp://localhost:5672", 13000);
