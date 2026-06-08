import express from "express"
import dotenv from "dotenv"
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { swaggerOptions } from "./swagger.js"
import { redisClient } from "./caching/redis_client.js"
import { rabbitMQService } from "./messaging/rabbitmq.js"
import { makeStreamRouter } from "./routes.js"
import { StreamService } from "./services/stream_service.js"
import { globalErrorHandler } from "./handlers/error_handler.js"

dotenv.config();

const app = express();
app.disable("x-powered-by");

const specs = swaggerJsDoc(swaggerOptions);

async function startServer() {
    app.use(express.json());

    if (process.env["NODE_ENV"] === "development") {
        app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
    }

    await bootstrap();

    app.use("/", makeStreamRouter(new StreamService(redisClient)));

    app.use(globalErrorHandler);

    const PORT = process.env["PORT"] || 13000;
    app.listen(PORT, () => {
        console.log(`Notification service listening on ${PORT}`);
    });
}

async function bootstrap() {
    await rabbitMQService.connect();
    await redisClient.connect();

    //todo: create and initialize consumers
}

process.on("SIGINT", async () =>{
    await rabbitMQService.close();

    if (redisClient.isOpen) {
        await redisClient.quit();
    }

    process.exit(0);
});

await startServer();
