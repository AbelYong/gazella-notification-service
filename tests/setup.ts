import { inject } from "vitest";

const dbUri = inject("dbUri");

process.env["DATABASE_URL"] = dbUri;
process.env["DATABASE_ADMIN_URL"] = dbUri;
