import crypto from "node:crypto" 
import { RedisClientType } from "redis";
import { Response } from "express"

export class StreamService {
    private readonly redis: RedisClientType;
    private readonly TICKET_TTL_SECONDS = 15;

    private readonly activeConnections = new Map<string, Set<Response>>();
    private readonly MAX_CONNECTIONS_PER_USER = 2;

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


    /**
     * Registers a new SSE connection and applies the up to 2 devices policy
     * @param userId 
     * @param res 
     */
    addConnection(userId: string, res: Response) : void {
        if (!this.activeConnections.has(userId)) {
            this.activeConnections.set(userId, new Set());
        }

        const userConnections = this.activeConnections.get(userId)!;

        if (userConnections.size >= this.MAX_CONNECTIONS_PER_USER) {
            const oldestConnection = userConnections.values().next().value;
            if (oldestConnection) {
                oldestConnection.write(`event: force-logout\ndata: ${JSON.stringify({ reason: "limit_reached" })}\n\n`);
                oldestConnection.end();
                userConnections.delete(oldestConnection);
            }
        }

        userConnections.add(res);
    }

    /**
     * Removes connection from the connection map
     * @param userId 
     * @param res 
     */
    removeConnection(userId: string, res: Response) : void {
        const userConnections = this.activeConnections.get(userId);
        if (userConnections) {
            userConnections.delete(res);
            if (userConnections.size === 0) {
                this.activeConnections.delete(userId);
            }
        }
    }

    broadcastToUser(userId: string, notification: any) : void {
        const userConnections = this.activeConnections.get(userId);

        if (userConnections && userConnections.size > 0) {
            userConnections.forEach((res) => {
                res.write(`data: ${JSON.stringify(notification)}\n\n`);
            });
        }
    }
}
