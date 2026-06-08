import crypto from "node:crypto" 
import { type RedisClientType } from "redis";

export class StreamService {
    private readonly redis: RedisClientType;
    private readonly TICKET_TTL_SECONDS = 15;

    constructor(redis: RedisClientType) {
        this.redis = redis;
    }

    getBase64Ticket(lenght = 32) : string {
        return crypto.randomBytes(lenght).toString("base64url");
    }

    async setTicket(ticket: string, userId: string): Promise<void> {
        const key = `ticket:${ticket}`;
        await this.redis.setEx(key, this.TICKET_TTL_SECONDS, userId);
    }

    async consumeTicket(ticket: string): Promise<string | null> {
        const key = `ticket:${ticket}`;
        const userId = await this.redis.getDel(key);
        return userId;
    }

    connect() {
        //todo
    }

    disconnect() {
        //todo
    }
}
