import express from "express";
import * as http from "node:http";

export interface TestServerInstance {
    server: http.Server;
    baseUrl: string;
}

/**
 * Boot an ephemeral Express application by mounting a specific router
 * on a free random port (0) to isolate the network environment from testing
 */
export async function startTestServer(router: express.Router): Promise<TestServerInstance> {
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json());
    app.use(router);

    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const port = (server.address() as any).port;
            const baseUrl = `http://localhost:${port}`;
            resolve({ server, baseUrl });
        });
    });
}
