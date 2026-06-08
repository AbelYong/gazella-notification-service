import express from "express"
import dotenv from "dotenv"
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { swaggerOptions } from "./swagger.js"
import { rabbitMQService } from "./messaging/rabbitmq.js"
import { NotificationsRouter } from "./routes.js"
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

    app.use("/", NotificationsRouter);

    await bootstrap();

    app.use(globalErrorHandler);

    const PORT = process.env["PORT"] || 13000;
    app.listen(PORT, () => {
        console.log(`Notification service listening on ${PORT}`);
    });
}

async function bootstrap() {
    await rabbitMQService.connect();

    //todo: create and initialize consumers
}

process.on("SIGINT", async () =>{
    await rabbitMQService.close();
    process.exit(0);
});

await startServer();
