import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { RabbitMQContainer } from "@testcontainers/rabbitmq";
import { RedisContainer } from "@testcontainers/redis";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
    const [postgresContainer, rabbitContainer, redisContainer] = await Promise.all([
        new PostgreSqlContainer("postgres:18.3-alpine")
            .withDatabase("gazella_test")
            .withUsername("test_user")
            .withPassword("test_pass")
            .start(),
        new RabbitMQContainer("rabbitmq:3-management-alpine").start(),
        new RedisContainer("redis:7.2-alpine").start()
    ]);

    const dbUri = postgresContainer.getConnectionUri();
    const rabbitUri = rabbitContainer.getAmqpUrl();
    const redisUri = redisContainer.getConnectionUrl();

    project.provide("dbUri", dbUri);
    project.provide("rabbitUri", rabbitUri);
    project.provide("redisUri", redisUri);

    const migrationClient = postgres(dbUri, { max: 1 });
    const db = drizzle({ client: migrationClient });
    
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    await migrationClient.end();

    return async () => {
        await postgresContainer.stop();
        await rabbitContainer.stop();
        await redisContainer.stop();
    };
}
