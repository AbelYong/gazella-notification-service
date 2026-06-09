import { inject } from "vitest";

const dbUri = inject("dbUri");
const rabbitUri = inject("rabbitUri");
const redisUri = inject("redisUri");

process.env["DATABASE_URL"] = dbUri;
process.env["DATABASE_ADMIN_URL"] = dbUri;
process.env["RABBITMQ_URL"] = rabbitUri;
process.env["REDIS_URL"] = redisUri;
