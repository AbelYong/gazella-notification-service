import { inject } from "vitest";

const dbUri = inject("dbUri");
const rabbitUri = inject("rabbitUri");

process.env["DATABASE_URL"] = dbUri;
process.env["DATABASE_ADMIN_URL"] = dbUri;
process.env["RABBITMQ_URL"] = rabbitUri;
