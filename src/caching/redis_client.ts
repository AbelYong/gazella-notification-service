import { createClient, RedisClientType } from "redis"

export function buildRedisClient(connectionUrl?: string): RedisClientType {
    const client = createClient({
        url: connectionUrl || process.env["REDIS_URL"] || "redis://localhost:6379",
        socket: {
            reconnectStrategy: (retries, _cause) => {
                const MAX_RETRIES = 20;
                if (retries > MAX_RETRIES) {
                    console.error("[REDIS] Reached reconnection attempts limit");
                    return new Error("Too many failed attempts");
                }
                const delay = Math.min(retries * 100, 3000);
                return delay;
            }
        }
    });

    client.on("error", (error) =>
        console.error("[REDIS] Client error: ", error)
    );

    client.on("connect", () =>
        console.info("[REDIS] Connected successfully")
    );

    client.on("ready", () =>
        console.info("[REDIS] Client ready to receive commands")
    );

    client.on("reconnecting", () =>
        console.info("[REDIS] Attempting reconnection...")
    );

    client.on("end", () =>
        console.warn("[REDIS] Connection permanently closed")
    );

    return client;
}

export const redisClient = buildRedisClient();
