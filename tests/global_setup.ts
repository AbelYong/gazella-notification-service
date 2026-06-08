import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { RabbitMQContainer } from "@testcontainers/rabbitmq";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
    const postgresContainer = await new PostgreSqlContainer("postgres:18.3-alpine")
        .withDatabase("gazella_test")
        .withUsername("test_user")
        .withPassword("test_pass")
        .start();
    const rabbitContainer = await new RabbitMQContainer("rabbitmq:3-management-alpine").start();

    const dbUri = postgresContainer.getConnectionUri();
    const rabbitUri = rabbitContainer.getAmqpUrl();

    project.provide("dbUri", dbUri);
    project.provide("rabbitUri", rabbitUri);

    const migrationClient = postgres(dbUri, { max: 1 });
    const db = drizzle({ client: migrationClient });
    
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    await migrationClient.end();

    return async () => {
        await postgresContainer.stop();
        await rabbitContainer.stop();
    };
}
