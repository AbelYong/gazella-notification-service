import { eq } from "drizzle-orm"
import { DbClient } from "../drizzle/db.js"
import { ArticleNotifications } from "../drizzle/schema.js"
import { DbError } from "./db_error.js"
import { ArticleLikedInput, ArticleCommentedInput } from "../schemas/article_schema.js"

export class ArticleRepository {
    constructor(private readonly db: DbClient) {}

    async storeArticleLikedNotification(message: ArticleLikedInput) {
        try {
            const [insertedNotification] = await this.db.insert(ArticleNotifications).values({
                addresseeId: message.authorId,
                messageBody: JSON.stringify(message)
            }).returning();

            return insertedNotification;
        } catch (error) {
            const message = "Failed to save article liked notification";
            console.error(message, error);
            throw new DbError(error, message);
        }
    }

    async storeArticleCommentedNotification(message: ArticleCommentedInput) {
        try {
            const [insertedNotification] = await this.db.insert(ArticleNotifications).values({
                addresseeId: message.authorId,
                messageBody: JSON.stringify(message)
            }).returning();

            return insertedNotification;
        } catch (error) {
            const message = "Failed to save article commented notification";
            console.error(message, error);
            throw new DbError(error, message);
        }
    }

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
