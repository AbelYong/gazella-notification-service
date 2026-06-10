import { Options } from "swagger-jsdoc"

export const swaggerOptions : Options = {
    definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gazella Notifications Service API',
      version: '1.0.0',
      description: "Gazella Notifications microservice API Documentation",
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
    servers: [
      {
        url: `http://localhost:${process.env["PORT"]}`,
        description: 'Development Server',
      },
    ],
  },
  apis: [
    `${process.cwd()}/src/**/*.ts`
  ]
};
