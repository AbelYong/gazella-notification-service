FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runner-base

RUN addgroup -S notification_service \
    && adduser -S notification_service -G notification_service
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY ./drizzle ./drizzle
EXPOSE 13000

FROM runner-base AS development

USER notification_service
ENV NODE_ENV=development
COPY --from=builder --chown=root:root --chmod=755 /app/src ./src
CMD ["node", "dist/index.js"]

FROM runner-base AS production

USER notification_service
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
