import { eq } from "drizzle-orm"
import { DbClient } from "../drizzle/db.js"
import { ArticleNotifications } from "../drizzle/schema.js"
import { DbError } from "./db_error.js"

export class ArticleRepository {
    constructor(private readonly db: DbClient) {}

    async getUnreadNotifications(addresseId: string) {
        return await this.db.query.ArticleNotifications.findMany({
            where: { addresseeId: addresseId, markedAsRead: false }
        });
    }

    async markNotificationAsRead(notificationId: string) {
        const [notification] = await this.db.update(ArticleNotifications).set({
            markedAsRead: true
        }).where(eq(ArticleNotifications.id, notificationId)).returning();

        return notification;
    }
}
