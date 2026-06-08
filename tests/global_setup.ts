import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
    const container = await new PostgreSqlContainer("postgres:18.3-alpine")
        .withDatabase("gazella_test")
        .withUsername("test_user")
        .withPassword("test_pass")
        .start();

    const uri = container.getConnectionUri();

    project.provide("dbUri", uri);

    const migrationClient = postgres(uri, { max: 1 });
    const db = drizzle({ client: migrationClient });
    
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    await migrationClient.end();

    return async () => {
        await container.stop();
    };
}
