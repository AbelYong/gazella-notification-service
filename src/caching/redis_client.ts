import { createClient } from "redis"

export const redisClient = createClient({
    url: process.env["REDIS_URL"] || "redis://localhost:6379",
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

redisClient.on("error", (error) =>
    console.error("[REDIS] Client error: ", error)
);

redisClient.on("connect", () =>
    console.info("[REDIS] Connected successfully")
);

redisClient.on("ready", () =>
    console.info("[REDIS] Client ready to receive commands")
);

redisClient.on("reconnecting", () =>
    console.info("[REDIS] Attempting reconnection...")
);

redisClient.on("end", () =>
    console.warn("[REDIS] Connection permanently closed")
)
