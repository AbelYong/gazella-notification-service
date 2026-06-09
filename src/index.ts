import express from "express"
import dotenv from "dotenv"
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { swaggerOptions } from "./swagger.js"
import { db } from "./drizzle/db.js"
import { SocialRepository } from "./data_access/social_repository.js"
import { ArticleRepository } from "./data_access/article_repository.js"
import { ProjectRepository } from "./data_access/project_repository.js"
import { redisClient } from "./caching/redis_client.js"
import { rabbitMQService } from "./messaging/rabbitmq.js"
import { SocialConsumer } from "./messaging/social_consumer.js"
import { StreamService } from "./services/stream_service.js"
import { InboxService } from "./services/inbox_service.js"
import { makeStreamRouter } from "./routes/stream_routes.js"
import { makeInboxRouter } from "./routes/inbox_routes.js"
import { globalErrorHandler } from "./handlers/error_handler.js"

dotenv.config();

const app = express();
app.disable("x-powered-by");

const specs = swaggerJsDoc(swaggerOptions);

let socialRepository: SocialRepository;
let articleRepository: ArticleRepository;
let projectRepository: ProjectRepository;

let streamService: StreamService;

async function startServer() {
    app.use(express.json());

    if (process.env["NODE_ENV"] === "development") {
        app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
    }

    await bootstrap();

    app.use(makeStreamRouter(streamService));
    app.use(makeInboxRouter(new InboxService(socialRepository, articleRepository, projectRepository)))

    app.use(globalErrorHandler);

    const PORT = process.env["PORT"] || 13000;
    app.listen(PORT, () => {
        console.log(`Notification service listening on ${PORT}`);
    });
}

async function bootstrap() {
    await rabbitMQService.connect();
    await redisClient.connect();

    socialRepository = new SocialRepository(db);
    articleRepository = new ArticleRepository(db);
    projectRepository = new ProjectRepository(db);

    streamService = new StreamService(redisClient);

    const channel = rabbitMQService.getChannel();
    const socialConsumer = new SocialConsumer(channel, socialRepository, streamService);

    await socialConsumer.initialize();
}

process.on("SIGINT", async () =>{
    await rabbitMQService.close();

    if (redisClient.isOpen) {
        await redisClient.quit();
    }

    process.exit(0);
});

await startServer();
