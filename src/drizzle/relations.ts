import * as schema from "./schema.js"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (_r) => ({
    SocialNotifications: { },
    ArticleNotifications: { },
    ProjectNotifications: { }
}));
