import * as pg from "drizzle-orm/pg-core"
import { pgTable } from "drizzle-orm/pg-core"

export const ArticleNotifications = pgTable(
    "article_notifications", {
        id: pg.uuid("id").primaryKey().defaultRandom(),
        addresseeId: pg.uuid("addressee_id").notNull(),
        messageBody: pg.jsonb("message_body").notNull(),
        markedAsRead: pg.boolean("marked_as_read").notNull().default(false),
        receivedAt: pg.timestamp("received_at").notNull().defaultNow()
    }
);

export const SocialNotifications = pgTable(
    "social_notifications", {
        id: pg.uuid("id").primaryKey().defaultRandom(),
        addresseeId: pg.uuid("addressee_id").notNull(),
        messageBody: pg.jsonb("message_body").notNull(),
        markedAsRead: pg.boolean("marked_as_read").notNull().default(false),
        receivedAt: pg.timestamp("received_at").notNull().defaultNow()
    }
);

export const ProjectNotifications = pgTable(
    "project_notifications", {
        id: pg.uuid("id").primaryKey().defaultRandom(),
        addresseeId: pg.uuid("addressee_id").notNull(),
        messageBody: pg.jsonb("message_body").notNull(),
        markedAsRead: pg.boolean("marked_as_read").notNull().default(false),
        receivedAt: pg.timestamp("received_at").notNull().defaultNow()
    }
);
